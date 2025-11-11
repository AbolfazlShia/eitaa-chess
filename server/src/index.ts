import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { randomUUID } from 'node:crypto';

type PublicUser = {
	name: string;
	avatarUrl?: string;
	displayId: string; // anonymized id for showing in UI (not username)
};

type PlayerSession = {
	id: string;
	publicUser: PublicUser;
	socketId?: string;
	coins: number;
	level: number; // 1..30
	lastActiveAt: number;
	dailyLiveMatches: number;
	dailyStamp: string; // YYYY-MM-DD
};

type MatchMode = 'invite' | 'random';

type Match = {
	id: string;
	mode: MatchMode;
	whiteId: string;
	blackId: string;
	createdAt: number;
	status: 'waiting' | 'live' | 'finished';
	result?: { winnerId?: string; reason: string };
};

const app = express();
app.use(helmet());
app.use(cors({ origin: '*'}));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: { origin: '*' }
});

// In-memory stores (replace with Redis/DB later)
const sessions = new Map<string, PlayerSession>();
const invites = new Map<string, { ownerSessionId: string; createdAt: number }>();
const matches = new Map<string, Match>();
const randomQueue: string[] = [];

// basic rate-limit map
const lastWinClaimAt = new Map<string, number>();

function getOrCreateSession(params: { eitaaId?: string; name?: string; avatarUrl?: string }): PlayerSession {
	// For MVP: eitaaId is treated as stable session key. Fall back to random for guests.
	const key = params.eitaaId || randomUUID();
	const existing = sessions.get(key);
	if (existing) {
		existing.lastActiveAt = Date.now();
		return existing;
	}
	const session: PlayerSession = {
		id: key,
		publicUser: {
			name: params.name || 'میهمان',
			avatarUrl: params.avatarUrl,
			displayId: key.slice(0, 6)
		},
		coins: 0,
		level: 1,
		lastActiveAt: Date.now(),
		dailyLiveMatches: 0,
		dailyStamp: todayStamp()
	};
	sessions.set(key, session);
	return session;
}

function ensureDailyWindow(s: PlayerSession) {
	const now = todayStamp();
	if (s.dailyStamp !== now) {
		s.dailyStamp = now;
		s.dailyLiveMatches = 0;
	}
}

const DAILY_LIVE_CAP = Number(process.env.DAILY_LIVE_CAP || 10);

// Health
app.get('/api/health', (_req, res) => {
	res.json({ ok: true, time: Date.now() });
});

// Issue invite link (returns inviteId to embed in URL)
app.post('/api/invites', (req, res) => {
	const { eitaaId, name, avatarUrl } = req.body || {};
	const session = getOrCreateSession({ eitaaId, name, avatarUrl });
	const inviteId = randomUUID();
	invites.set(inviteId, { ownerSessionId: session.id, createdAt: Date.now() });
	res.json({ inviteId });
});

// Accept invite -> creates a match if valid
app.post('/api/invites/:inviteId/accept', (req, res) => {
	const { inviteId } = req.params;
	const data = invites.get(inviteId);
	if (!data) return res.status(404).json({ error: 'INVITE_NOT_FOUND' });
	const { eitaaId, name, avatarUrl } = req.body || {};
	const joiner = getOrCreateSession({ eitaaId, name, avatarUrl });
	const owner = sessions.get(data.ownerSessionId);
	if (!owner) return res.status(400).json({ error: 'INVITE_OWNER_GONE' });
	ensureDailyWindow(joiner);
	if (joiner.dailyLiveMatches >= DAILY_LIVE_CAP) {
		return res.status(429).json({ error: 'DAILY_LIVE_CAP_REACHED' });
	}
	const matchId = randomUUID();
	const isWhite = Math.random() < 0.5;
	const match: Match = {
		id: matchId,
		mode: 'invite',
		whiteId: isWhite ? owner.id : joiner.id,
		blackId: isWhite ? joiner.id : owner.id,
		createdAt: Date.now(),
		status: 'waiting'
	};
	matches.set(matchId, match);
	invites.delete(inviteId);
	res.json({ matchId });
	// notify sockets if connected
	if (owner.socketId) io.to(owner.socketId).emit('match:created', { matchId });
	if (joiner.socketId) io.to(joiner.socketId).emit('match:created', { matchId });
});

// Join random queue
app.post('/api/random/join', (req, res) => {
	const { eitaaId, name, avatarUrl } = req.body || {};
	const session = getOrCreateSession({ eitaaId, name, avatarUrl });
	ensureDailyWindow(session);
	if (session.dailyLiveMatches >= DAILY_LIVE_CAP) {
		return res.status(429).json({ error: 'DAILY_LIVE_CAP_REACHED' });
	}
	if (!randomQueue.includes(session.id)) randomQueue.push(session.id);
	res.json({ queued: true });
	tryMatchmake();
});

// Single-player win claim (award coins based on AI level)
app.post('/api/single/win', (req, res) => {
	const { eitaaId, name, avatarUrl, level } = req.body || {};
	if (!level || level < 1 || level > 5) return res.status(400).json({ error: 'BAD_LEVEL' });
	const session = getOrCreateSession({ eitaaId, name, avatarUrl });
	const now = Date.now();
	const last = lastWinClaimAt.get(session.id) || 0;
	if (now - last < 10_000) { // 10s cooldown anti-spam
		return res.status(429).json({ error: 'TOO_FAST' });
	}
	lastWinClaimAt.set(session.id, now);
	// award: increasing by level
	const award = [0, 10, 15, 20, 25, 35][level] ?? 10;
	session.coins += award;
	while (session.coins >= session.level * 100 && session.level < 30) {
		session.level += 1;
	}
	res.json({ ok: true, coins: session.coins, level: session.level, award });
});

function tryMatchmake() {
	while (randomQueue.length >= 2) {
		const a = randomQueue.shift()!;
		const b = randomQueue.shift()!;
		const isWhite = Math.random() < 0.5;
		const matchId = randomUUID();
		const match: Match = {
			id: matchId,
			mode: 'random',
			whiteId: isWhite ? a : b,
			blackId: isWhite ? b : a,
			createdAt: Date.now(),
			status: 'waiting'
		};
		matches.set(matchId, match);
		const sa = sessions.get(a);
		const sb = sessions.get(b);
		if (sa?.socketId) io.to(sa.socketId).emit('match:created', { matchId });
		if (sb?.socketId) io.to(sb.socketId).emit('match:created', { matchId });
	}
}

io.on('connection', (socket) => {
	// Client should immediately send auth with eitaa params
	socket.on('auth', (payload: { eitaaId?: string; name?: string; avatarUrl?: string }) => {
		const s = getOrCreateSession(payload || {});
		s.socketId = socket.id;
		socket.emit('auth:ok', { me: s.publicUser, coins: s.coins, level: s.level });
	});

	socket.on('match:join', ({ matchId }) => {
		const match = matches.get(matchId);
		if (!match) return;
		
		// Find session for this socket
		let playerSession: PlayerSession | undefined;
		for (const s of sessions.values()) {
			if (s.socketId === socket.id) {
				playerSession = s;
				break;
			}
		}
		if (!playerSession) return;
		
		socket.join(`match:${matchId}`);
		
		// Send opponent info and player's color
		const isWhite = playerSession.id === match.whiteId;
		const opponentId = isWhite ? match.blackId : match.whiteId;
		const opponent = sessions.get(opponentId);
		if (opponent) {
			socket.emit('opponent:info', {
				name: opponent.publicUser.name,
				avatarUrl: opponent.publicUser.avatarUrl,
				myColor: isWhite ? 'w' : 'b' // player's own color
			});
		}
		
		// When both sides joined, switch to live
		const room = io.sockets.adapter.rooms.get(`match:${matchId}`);
		if (room && room.size >= 2 && match.status !== 'live') {
			match.status = 'live';
			io.to(`match:${matchId}`).emit('match:live', {
				matchId,
				whiteId: match.whiteId,
				blackId: match.blackId,
				white: sessions.get(match.whiteId)?.publicUser,
				black: sessions.get(match.blackId)?.publicUser
			});
			// increment daily counters
			const a = sessions.get(match.whiteId);
			const b = sessions.get(match.blackId);
			if (a) { ensureDailyWindow(a); a.dailyLiveMatches += 1; }
			if (b) { ensureDailyWindow(b); b.dailyLiveMatches += 1; }
		}
	});

	// Relay chess moves (server does not validate chess legality — client must validate; later add server-side)
	socket.on('move', ({ matchId, move, fen }) => {
		socket.to(`match:${matchId}`).emit('move', { move, fen });
	});

	// Canned chat
	socket.on('chat:canned', ({ matchId, code }) => {
		socket.to(`match:${matchId}`).emit('chat:canned', { code });
	});

	// Resign / draw
	socket.on('match:result', ({ matchId, winnerId, reason }) => {
		const match = matches.get(matchId);
		if (!match || match.status === 'finished') return;
		match.status = 'finished';
		match.result = { winnerId, reason };
		io.to(`match:${matchId}`).emit('match:finished', match.result);
		// simple coins/leveling placeholder
		if (winnerId) {
			rewardWinner(match, winnerId);
		}
	});

	socket.on('disconnect', () => {
		// best-effort: find session and clear socket
		for (const s of sessions.values()) {
			if (s.socketId === socket.id) {
				s.socketId = undefined;
				break;
			}
		}
	});
});

function rewardWinner(match: Match, winnerId: string) {
	const winner = sessions.get(winnerId);
	if (!winner) return;
	const isRandom = match.mode === 'random';
	// base coins for multiplayer; single-player handled client-side submit later
	const coins = isRandom ? 40 : 30; // random > invite
	winner.coins += coins;
	// naive leveling: 100 coins per level up, max 30
	while (winner.coins >= winner.level * 100 && winner.level < 30) {
		winner.level += 1;
	}
}

const PORT = Number(process.env.PORT || 8787);
httpServer.listen(PORT, () => {
	// eslint-disable-next-line no-console
	console.log(`Server listening on http://localhost:${PORT}`);
});

function todayStamp() {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}


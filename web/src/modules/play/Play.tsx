import React, { useEffect, useMemo, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import {
	makeInitialBoard,
	loadBoardFromFEN,
	type BoardState,
	moveOnBoard,
	serializeFEN,
	getLegalMoves,
	getGameStatus,
	getAllPieces,
	getPieceAt
} from './chessCore';
import { getAIMove } from './ai';
import { cannedMessages } from './canned';

type Props = {
	route: { name: 'play'; mode?: 'single' | 'invite' | 'random'; matchId?: string };
	goHome: () => void;
	socket: Socket;
	userInfo?: { name: string; avatarUrl?: string; coins: number; level: number };
};

type Timer = {
	white: number; // seconds
	black: number;
	lastUpdate: number;
	turn: 'w' | 'b';
};

const INITIAL_TIME = 10 * 60; // 10 minutes
const INCREMENT = 2; // 2 seconds per move

export const Play: React.FC<Props> = ({ route, goHome, socket, userInfo }) => {
	const [board, setBoard] = useState<BoardState>(() => makeInitialBoard());
	const [selected, setSelected] = useState<string | null>(null);
	const [status, setStatus] = useState<string>('در حال آماده‌سازی…');
	const [aiLevel, setAiLevel] = useState<number>(3);
	const [opponent, setOpponent] = useState<{ name: string; avatarUrl?: string } | null>(null);
	const [isMyTurn, setIsMyTurn] = useState<boolean>(true);
	const [myColor, setMyColor] = useState<'w' | 'b'>('w');
	const [legalMoves, setLegalMoves] = useState<string[]>([]);
	const [gameOver, setGameOver] = useState<{ winner?: 'w' | 'b'; reason: string } | null>(null);
	const [timer, setTimer] = useState<Timer>(() => ({
		white: INITIAL_TIME,
		black: INITIAL_TIME,
		lastUpdate: Date.now(),
		turn: 'w'
	}));
	const [promotionSquare, setPromotionSquare] = useState<string | null>(null);

	const isMultiplayer = route.mode === 'invite' || route.mode === 'random';
	const gameStatus = getGameStatus(board);

	// Timer effect
	useEffect(() => {
		if (gameOver || !isMultiplayer) return;
		const interval = setInterval(() => {
			setTimer((t) => {
				const now = Date.now();
				const elapsed = Math.floor((now - t.lastUpdate) / 1000);
				if (elapsed === 0) return t;
				const newTimer = { ...t };
				if (t.turn === 'w') {
					newTimer.white = Math.max(0, t.white - elapsed);
					if (newTimer.white === 0) {
						setGameOver({ winner: 'b', reason: 'زمان تمام شد' });
					}
				} else {
					newTimer.black = Math.max(0, t.black - elapsed);
					if (newTimer.black === 0) {
						setGameOver({ winner: 'w', reason: 'زمان تمام شد' });
					}
				}
				newTimer.lastUpdate = now;
				return newTimer;
			});
		}, 1000);
		return () => clearInterval(interval);
	}, [gameOver, isMultiplayer, timer.turn]);

	// Multiplayer setup
	useEffect(() => {
		if (!isMultiplayer) {
			setStatus('نوبت شما');
			setIsMyTurn(true);
			return;
		}

		if (route.matchId) {
			socket.emit('match:join', { matchId: route.matchId });
			setStatus('منتظر حریف…');
		} else {
			setStatus('در حال ساخت مسابقه…');
		}

		const onLive = (data: { whiteId?: string; blackId?: string; white?: any; black?: any }) => {
			setStatus('بازی شروع شد!');
			// Determine my color - we'll get this from server or determine from opponent
			const params = new URLSearchParams(location.search);
			const myEitaaId = params.get('eitaa_id');
			// Server will tell us via opponent info which side we are
		};

		const onMove = ({ move, fen, turn }: any) => {
			// Load board from FEN received from server
			if (fen) {
				const loaded = loadBoardFromFEN(fen);
				setBoard(loaded);
			} else {
				// Fallback: try to make move
				const result = moveOnBoard(board, move.from, move.to, move.promotion);
				if (result.ok && result.board) {
					setBoard(result.board);
				}
			}
			const nextTurn = turn === 'w' ? 'b' : 'w';
			setIsMyTurn(nextTurn === myColor);
			setTimer((t) => ({
				...t,
				turn: nextTurn,
				lastUpdate: Date.now(),
				[turn === 'w' ? 'white' : 'black']: t[turn === 'w' ? 'white' : 'black'] + INCREMENT
			}));
		};

		const onOpponent = (data: { name: string; avatarUrl?: string; myColor?: 'w' | 'b' }) => {
			setOpponent({ name: data.name, avatarUrl: data.avatarUrl });
			// Set my color from server
			if (data.myColor) {
				setMyColor(data.myColor);
				setIsMyTurn(data.myColor === 'w'); // White starts
			}
		};

		const onFinished = (result: { winnerId?: string; reason: string }) => {
			setGameOver({ winner: result.winnerId ? 'w' : 'b', reason: result.reason });
		};

		socket.on('match:live', onLive);
		socket.on('move', onMove);
		socket.on('opponent:info', onOpponent);
		socket.on('match:finished', onFinished);

		return () => {
			socket.off('match:live', onLive);
			socket.off('move', onMove);
			socket.off('opponent:info', onOpponent);
			socket.off('match:finished', onFinished);
		};
	}, [socket, route.matchId, isMultiplayer, board, myColor]);

	// Game status updates
	useEffect(() => {
		if (gameStatus.isCheckmate) {
			setGameOver({ winner: gameStatus.winner, reason: 'کیش و مات' });
			if (isMultiplayer && route.matchId) {
				socket.emit('match:result', {
					matchId: route.matchId,
					winnerId: gameStatus.winner === 'w' ? 'white' : 'black',
					reason: 'checkmate'
				});
			} else if (route.mode === 'single' && gameStatus.winner === 'w') {
				// Claim win reward
				fetch('/api/single/win', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						eitaaId: new URLSearchParams(location.search).get('eitaa_id'),
						name: new URLSearchParams(location.search).get('name'),
						avatarUrl: new URLSearchParams(location.search).get('avatar_url'),
						level: aiLevel
					})
				});
			}
		} else if (gameStatus.isStalemate || gameStatus.isDraw) {
			setGameOver({ reason: gameStatus.isStalemate ? 'پات' : 'مساوی' });
		} else if (gameStatus.isCheck) {
			setStatus('کیش!');
		} else {
			if (!gameOver) {
				setStatus(isMyTurn ? 'نوبت شما' : 'نوبت حریف');
			}
		}
	}, [gameStatus, isMyTurn, isMultiplayer, route.matchId, route.mode, aiLevel, socket, gameOver]);

	// Update legal moves when selection changes
	useEffect(() => {
		if (selected) {
			setLegalMoves(getLegalMoves(board, selected));
		} else {
			setLegalMoves([]);
		}
	}, [selected, board]);

	// AI move
	useEffect(() => {
		if (route.mode === 'single' && !isMyTurn && !gameOver && gameStatus.turn === 'b') {
			// Small delay for better UX
			const timeout = setTimeout(() => {
				getAIMove(board, aiLevel).then((move) => {
					if (move) {
						const result = moveOnBoard(board, move.from, move.to, move.promotion as any);
						if (result.ok && result.board) {
							setBoard(result.board);
							setIsMyTurn(true);
						}
					}
				});
			}, 500);
			return () => clearTimeout(timeout);
		}
	}, [isMyTurn, route.mode, board, aiLevel, gameOver, gameStatus.turn]);

	const doMove = useCallback(
		(from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => {
			if (!isMyTurn && isMultiplayer) return;
			if (gameOver) return;

			const result = moveOnBoard(board, from, to, promotion);
			if (!result.ok || !result.board) {
				setSelected(null);
				return;
			}

			// Check for promotion - need to check if pawn reaches last rank
			const fromRank = parseInt(from[1]);
			const toRank = parseInt(to[1]);
			const piece = getPieceAt(board, from);
			if (piece && piece.includes('p') && ((piece.startsWith('w') && toRank === 8) || (piece.startsWith('b') && toRank === 1))) {
				setPromotionSquare(to);
				return;
			}

			setBoard(result.board);
			setIsMyTurn(false);
			setSelected(null);

			if (isMultiplayer && route.matchId) {
				socket.emit('move', {
					matchId: route.matchId,
					move: { from, to, promotion },
					fen: serializeFEN(result.board),
					turn: gameStatus.turn === 'w' ? 'b' : 'w'
				});
				setTimer((t) => ({
					...t,
					turn: t.turn === 'w' ? 'b' : 'w',
					lastUpdate: Date.now(),
					[t.turn === 'w' ? 'white' : 'black']: t[t.turn === 'w' ? 'white' : 'black'] + INCREMENT
				}));
			}
		},
		[board, isMyTurn, isMultiplayer, route.matchId, socket, gameStatus.turn, gameOver]
	);

	const onSquareClick = (square: string) => {
		if (gameOver) return;
		if (!isMyTurn && isMultiplayer) return;

		if (selected === null) {
			const piece = getPieceAt(board, square);
			if (piece && ((piece.startsWith('w') && gameStatus.turn === 'w') || (piece.startsWith('b') && gameStatus.turn === 'b'))) {
				setSelected(square);
			}
		} else {
			if (selected === square) {
				setSelected(null);
			} else if (legalMoves.includes(square)) {
				doMove(selected, square);
			} else {
				// Try selecting new piece
				const piece = getPieceAt(board, square);
				if (piece && ((piece.startsWith('w') && gameStatus.turn === 'w') || (piece.startsWith('b') && gameStatus.turn === 'b'))) {
					setSelected(square);
				} else {
					setSelected(null);
				}
			}
		}
	};

	const handlePromotion = (promo: 'q' | 'r' | 'b' | 'n') => {
		if (!promotionSquare || !selected) return;
		doMove(selected, promotionSquare, promo);
		setPromotionSquare(null);
	};

	const resign = () => {
		if (isMultiplayer && route.matchId) {
			socket.emit('match:result', {
				matchId: route.matchId,
				winnerId: myColor === 'w' ? 'black' : 'white',
				reason: 'resignation'
			});
		}
		setGameOver({ winner: myColor === 'w' ? 'b' : 'w', reason: 'استعفا' });
	};

	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	return (
		<div className="play-container">
			<div className="play-header">
				<button onClick={goHome} className="btn-back">
					← خانه
				</button>
				<div className="play-title">شطرنج هخامنشی</div>
				{userInfo && (
					<div className="user-badge">
						{userInfo.avatarUrl && (
							<img src={userInfo.avatarUrl} alt={userInfo.name} className="avatar-small" />
						)}
						<span>{userInfo.name}</span>
						<span className="coins">🪙 {userInfo.coins}</span>
						<span className="level">⭐ {userInfo.level}</span>
					</div>
				)}
			</div>

			<div className="play-grid">
				<div className="play-main">
					<div className="game-info">
						{opponent && (
							<div className="opponent-info">
								{opponent.avatarUrl && (
									<img src={opponent.avatarUrl} alt={opponent.name} className="avatar" />
								)}
								<div>
									<div className="opponent-name">{opponent.name}</div>
									{isMultiplayer && (
										<div className="timer">
											{myColor === 'b' ? formatTime(timer.white) : formatTime(timer.black)}
										</div>
									)}
								</div>
							</div>
						)}
						<div className="status-bar">
							<div className={`status ${gameOver ? 'game-over' : ''}`}>{status}</div>
							{route.mode === 'single' && (
								<select
									value={aiLevel}
									onChange={(e) => setAiLevel(Number(e.target.value))}
									className="level-select"
									disabled={!isMyTurn}
								>
									<option value={1}>آسان</option>
									<option value={2}>متوسط-</option>
									<option value={3}>متوسط</option>
									<option value={4}>سخت</option>
									<option value={5}>خیلی سخت</option>
								</select>
							)}
							{isMultiplayer && (
								<div className="timer">
									{myColor === 'w' ? formatTime(timer.white) : formatTime(timer.black)}
								</div>
							)}
						</div>
					</div>

					<Board
						board={board}
						selected={selected}
						legalMoves={legalMoves}
						onSquareClick={onSquareClick}
						flipped={myColor === 'b'}
					/>

					{promotionSquare && (
						<div className="promotion-modal">
							<div className="promotion-title">انتخاب مهره:</div>
							<div className="promotion-pieces">
								{['q', 'r', 'b', 'n'].map((p) => (
									<button
										key={p}
										onClick={() => handlePromotion(p as any)}
										className="promotion-btn"
									>
										{pieceToGlyph(gameStatus.turn === 'w' ? p.toUpperCase() : p)}
									</button>
								))}
							</div>
						</div>
					)}

					{gameOver && (
						<div className="game-over-modal">
							<div className="game-over-content">
								<div className="game-over-title">
									{gameOver.winner
										? `برنده: ${gameOver.winner === 'w' ? 'سفید' : 'سیاه'}`
										: 'مساوی'}
								</div>
								<div className="game-over-reason">{gameOver.reason}</div>
								<button onClick={goHome} className="btn-primary">
									بازگشت به خانه
								</button>
							</div>
						</div>
					)}

					<div className="game-actions">
						<button onClick={resign} className="btn-resign" disabled={!!gameOver}>
							استعفا
						</button>
					</div>
				</div>

				<div className="play-sidebar">
					<div className="card">
						<h3>پیام‌های آماده</h3>
						<div className="canned-messages">
							{Object.entries(cannedMessages).map(([group, items]) => (
								<div key={group} className="canned-group">
									<div className="canned-group-title">{group}</div>
									{items.map((m) => (
										<button
											key={m.code}
											onClick={() =>
												route.matchId &&
												socket.emit('chat:canned', { matchId: route.matchId, code: m.code })
											}
											className="canned-btn"
											disabled={!isMultiplayer}
										>
											{m.text}
										</button>
									))}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

const Board: React.FC<{
	board: BoardState;
	selected: string | null;
	legalMoves: string[];
	onSquareClick: (square: string) => void;
	flipped: boolean;
}> = ({ board, selected, legalMoves, onSquareClick, flipped }) => {
	const pieces = getAllPieces(board);
	const squares = [];
	const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
	const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

	if (flipped) {
		files.reverse();
		ranks.reverse();
	}

	for (const rank of ranks) {
		for (const file of files) {
			const square = `${file}${rank}`;
			const piece = pieces.find((p) => p.square === square);
			const isDark = (file.charCodeAt(0) - 97 + rank) % 2 === 1;
			const isSelected = selected === square;
			const isLegal = legalMoves.includes(square);

			squares.push(
				<div
					key={square}
					className={`square ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''} ${isLegal ? 'legal' : ''}`}
					onClick={() => onSquareClick(square)}
				>
					{piece && <div className="piece">{pieceToGlyph(piece.piece)}</div>}
					{isLegal && <div className="legal-marker" />}
				</div>
			);
		}
	}

	return <div className="board">{squares}</div>;
};

function pieceToGlyph(piece: string): string {
	const map: Record<string, string> = {
		wp: '♙',
		wn: '♘',
		wb: '♗',
		wr: '♖',
		wq: '♕',
		wk: '♔',
		bp: '♟',
		bn: '♞',
		bb: '♝',
		br: '♜',
		bq: '♛',
		bk: '♚'
	};
	return map[piece] || '';
}

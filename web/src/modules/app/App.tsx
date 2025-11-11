import React, { useMemo, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Home } from '../home/Home';
import { Play } from '../play/Play';

type Route = { name: 'home' } | { name: 'play'; mode?: 'single' | 'invite' | 'random'; matchId?: string };

type UserInfo = {
	name: string;
	avatarUrl?: string;
	coins: number;
	level: number;
};

export const App: React.FC = () => {
	const [route, setRoute] = useState<Route>({ name: 'home' });
	const [userInfo, setUserInfo] = useState<UserInfo | undefined>(undefined);
	const socket = useMemo<Socket>(() => {
		const apiUrl = import.meta.env.VITE_API_URL || '';
		const s = io(apiUrl || '/', { autoConnect: true });
		s.on('connect', () => {
			// Read identity from URL params (Eitaa bot)
			const params = new URLSearchParams(location.search);
			s.emit('auth', {
				eitaaId: params.get('eitaa_id') || undefined,
				name: params.get('name') || undefined,
				avatarUrl: params.get('avatar_url') || undefined
			});
		});
		s.on('auth:ok', (data: { me: { name: string; avatarUrl?: string }; coins: number; level: number }) => {
			setUserInfo({
				name: data.me.name,
				avatarUrl: data.me.avatarUrl,
				coins: data.coins,
				level: data.level
			});
		});
		return s;
	}, []);

	return (
		<div className="container">
			{route.name === 'home' && (
				<Home onStart={(r) => setRoute(r)} socket={socket} userInfo={userInfo} />
			)}
			{route.name === 'play' && (
				<Play route={route} goHome={() => setRoute({ name: 'home' })} socket={socket} userInfo={userInfo} />
			)}
		</div>
	);
};

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Home } from '../home/Home';
import { Play } from '../play/Play';
export const App = () => {
    const [route, setRoute] = useState({ name: 'home' });
    const [userInfo, setUserInfo] = useState(undefined);
    const socket = useMemo(() => {
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
        s.on('auth:ok', (data) => {
            setUserInfo({
                name: data.me.name,
                avatarUrl: data.me.avatarUrl,
                coins: data.coins,
                level: data.level
            });
        });
        return s;
    }, []);
    return (_jsxs("div", { className: "container", children: [route.name === 'home' && (_jsx(Home, { onStart: (r) => setRoute(r), socket: socket, userInfo: userInfo })), route.name === 'play' && (_jsx(Play, { route: route, goHome: () => setRoute({ name: 'home' }), socket: socket, userInfo: userInfo }))] }));
};

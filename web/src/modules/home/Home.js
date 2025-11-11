import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
export const Home = ({ onStart, socket, userInfo }) => {
    const [inviteId, setInviteId] = useState(null);
    const [loading, setLoading] = useState(null);
    useEffect(() => {
        socket.on('match:created', ({ matchId }) => {
            onStart({ name: 'play', mode: 'invite', matchId });
        });
        return () => {
            socket.off('match:created');
        };
    }, [socket, onStart]);
    const startInvite = async () => {
        setLoading('invite');
        try {
            const params = new URLSearchParams(location.search);
            const r = await fetch('/api/invites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eitaaId: params.get('eitaa_id') || undefined,
                    name: params.get('name') || undefined,
                    avatarUrl: params.get('avatar_url') || undefined
                })
            });
            const data = await r.json();
            setInviteId(data.inviteId);
        }
        catch (err) {
            console.error('Failed to create invite:', err);
        }
        finally {
            setLoading(null);
        }
    };
    const acceptInviteIfPresent = async () => {
        const params = new URLSearchParams(location.search);
        const id = params.get('invite');
        if (!id)
            return;
        try {
            const r = await fetch(`/api/invites/${id}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eitaaId: params.get('eitaa_id') || undefined,
                    name: params.get('name') || undefined,
                    avatarUrl: params.get('avatar_url') || undefined
                })
            });
            const data = await r.json();
            if (data.matchId) {
                onStart({ name: 'play', mode: 'invite', matchId: data.matchId });
            }
            else if (data.error === 'DAILY_LIVE_CAP_REACHED') {
                alert('شما امروز به سقف مسابقات زنده رسیده‌اید. فردا دوباره تلاش کنید!');
            }
        }
        catch (err) {
            console.error('Failed to accept invite:', err);
        }
    };
    useEffect(() => {
        acceptInviteIfPresent();
    }, []);
    const joinRandom = async () => {
        setLoading('random');
        try {
            const params = new URLSearchParams(location.search);
            const r = await fetch('/api/random/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eitaaId: params.get('eitaa_id') || undefined,
                    name: params.get('name') || undefined,
                    avatarUrl: params.get('avatar_url') || undefined
                })
            });
            if (r.ok) {
                onStart({ name: 'play', mode: 'random' });
            }
            else if (r.status === 429) {
                alert('شما امروز به سقف مسابقات زنده رسیده‌اید. فردا دوباره تلاش کنید!');
            }
        }
        catch (err) {
            console.error('Failed to join random:', err);
        }
        finally {
            setLoading(null);
        }
    };
    const inviteLink = inviteId ? `${location.origin}${location.pathname}?invite=${inviteId}${getEitaaParams()}` : '';
    return (_jsxs("div", { className: "card", children: [_jsx("div", { className: "h1", children: "\uD83D\uDC51 \u0634\u0637\u0631\u0646\u062C \u0647\u062E\u0627\u0645\u0646\u0634\u06CC \uD83D\uDC51" }), _jsx("p", { style: { textAlign: 'center', marginBottom: '32px', fontSize: '18px', color: 'var(--gold-light)' }, children: "\u0628\u0627\u0632\u06CC \u0634\u0637\u0631\u0646\u062C \u0628\u0627 \u062A\u0645 \u0628\u0627\u0633\u062A\u0627\u0646\u06CC \u0627\u06CC\u0631\u0627\u0646" }), userInfo && (_jsx("div", { className: "user-stats", style: { marginBottom: '24px', textAlign: 'center' }, children: _jsxs("div", { style: { display: 'inline-flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }, children: [userInfo.avatarUrl && (_jsx("img", { src: userInfo.avatarUrl, alt: userInfo.name, className: "avatar-small" })), _jsx("span", { style: { fontWeight: 600, fontSize: '18px' }, children: userInfo.name }), _jsxs("span", { className: "coins", style: { fontSize: '16px' }, children: ["\uD83E\uDE99 ", userInfo.coins, " \u0633\u06A9\u0647"] }), _jsxs("span", { className: "level", style: { fontSize: '16px' }, children: ["\u2B50 \u0633\u0637\u062D ", userInfo.level] })] }) })), _jsxs("div", { className: "grid home-grid", style: { marginTop: '24px' }, children: [_jsx("div", { className: "col-4", children: _jsxs("div", { className: "card", children: [_jsx("h3", { children: "\uD83C\uDFAE \u062A\u06A9\u200C\u0646\u0641\u0631\u0647" }), _jsx("p", { children: "\u0628\u0627\u0632\u06CC \u0628\u0627 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC \u062F\u0631 \u06F5 \u0633\u0637\u062D \u0645\u062E\u062A\u0644\u0641. \u0647\u0631 \u0633\u0637\u062D \u0633\u06A9\u0647\u200C\u0647\u0627\u06CC \u0628\u06CC\u0634\u062A\u0631\u06CC \u0628\u0647 \u0628\u0631\u0646\u062F\u0647 \u0645\u06CC\u200C\u062F\u0647\u062F." }), _jsx("button", { onClick: () => onStart({ name: 'play', mode: 'single' }), disabled: loading !== null, children: "\u0634\u0631\u0648\u0639 \u0628\u0627\u0632\u06CC" })] }) }), _jsx("div", { className: "col-4", children: _jsxs("div", { className: "card", children: [_jsx("h3", { children: "\uD83D\uDC65 \u062F\u0639\u0648\u062A \u062F\u0648\u0633\u062A\u0627\u0646" }), _jsx("p", { children: "\u0633\u0627\u062E\u062A \u0644\u06CC\u0646\u06A9 \u062F\u0639\u0648\u062A \u0648 \u0627\u0631\u0633\u0627\u0644 \u062F\u0631 \u0627\u06CC\u062A\u0627. \u0628\u0631\u0646\u062F\u0647 \u06F3\u06F0 \u0633\u06A9\u0647 \u062F\u0631\u06CC\u0627\u0641\u062A \u0645\u06CC\u200C\u06A9\u0646\u062F." }), !inviteId ? (_jsx("button", { onClick: startInvite, disabled: loading !== null, children: loading === 'invite' ? 'در حال ساخت...' : 'ساخت لینک دعوت' })) : (_jsxs("div", { children: [_jsx("div", { className: "tag", style: { direction: 'ltr', wordBreak: 'break-all', marginBottom: '12px' }, children: inviteLink }), _jsx("button", { onClick: () => navigator.clipboard.writeText(inviteLink), children: "\uD83D\uDCCB \u06A9\u067E\u06CC \u0644\u06CC\u0646\u06A9" }), _jsx("button", { onClick: () => setInviteId(null), style: { marginTop: '8px', background: 'var(--panel)', borderColor: 'var(--accent)' }, children: "\u0644\u063A\u0648" })] }))] }) }), _jsx("div", { className: "col-4", children: _jsxs("div", { className: "card", children: [_jsx("h3", { children: "\uD83C\uDFB2 \u0631\u0642\u06CC\u0628 \u0634\u0627\u0646\u0633\u06CC" }), _jsx("p", { children: "\u067E\u06CC\u062F\u0627 \u06A9\u0631\u062F\u0646 \u062D\u0631\u06CC\u0641 \u0646\u0627\u0634\u0646\u0627\u0633 \u0628\u0627 \u0646\u0645\u0627\u06CC\u0634 \u0627\u0633\u0645 \u0648 \u0639\u06A9\u0633. \u0628\u0631\u0646\u062F\u0647 \u06F4\u06F0 \u0633\u06A9\u0647 \u062F\u0631\u06CC\u0627\u0641\u062A \u0645\u06CC\u200C\u06A9\u0646\u062F." }), _jsx("button", { onClick: joinRandom, disabled: loading !== null, children: loading === 'random' ? 'در حال جستجو...' : 'پیدا کردن حریف' })] }) })] }), _jsxs("div", { style: { marginTop: '32px', textAlign: 'center' }, children: [_jsx("div", { className: "tag", style: { margin: '8px' }, children: "\u0648\u0631\u0648\u062F: \u0628\u062F\u0648\u0646 \u062B\u0628\u062A\u200C\u0646\u0627\u0645 (\u0627\u0632 \u0627\u06CC\u062A\u0627)" }), _jsx("div", { className: "tag", style: { margin: '8px' }, children: "\u0647\u0631 \u06F1\u06F0\u06F0 \u0633\u06A9\u0647 = \u06CC\u06A9 \u0633\u0637\u062D (\u062D\u062F\u0627\u06A9\u062B\u0631 \u0633\u0637\u062D \u06F3\u06F0)" }), _jsx("div", { className: "tag", style: { margin: '8px' }, children: "\u062D\u062F\u0627\u06A9\u062B\u0631 \u06F1\u06F0 \u0645\u0633\u0627\u0628\u0642\u0647 \u0632\u0646\u062F\u0647 \u062F\u0631 \u0631\u0648\u0632" })] })] }));
};
function getEitaaParams() {
    const params = new URLSearchParams(location.search);
    const parts = [];
    if (params.get('eitaa_id'))
        parts.push(`eitaa_id=${encodeURIComponent(params.get('eitaa_id'))}`);
    if (params.get('name'))
        parts.push(`name=${encodeURIComponent(params.get('name'))}`);
    if (params.get('avatar_url'))
        parts.push(`avatar_url=${encodeURIComponent(params.get('avatar_url'))}`);
    return parts.length > 0 ? `&${parts.join('&')}` : '';
}

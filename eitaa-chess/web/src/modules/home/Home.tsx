import React, { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

type Props = {
	onStart: (route: { name: 'play'; mode?: 'single' | 'invite' | 'random'; matchId?: string }) => void;
	socket: Socket;
	userInfo?: { name: string; avatarUrl?: string; coins: number; level: number };
};

export const Home: React.FC<Props> = ({ onStart, socket, userInfo }) => {
	const [inviteId, setInviteId] = useState<string | null>(null);
	const [loading, setLoading] = useState<string | null>(null);

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
		} catch (err) {
			console.error('Failed to create invite:', err);
		} finally {
			setLoading(null);
		}
	};

	const acceptInviteIfPresent = async () => {
		const params = new URLSearchParams(location.search);
		const id = params.get('invite');
		if (!id) return;
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
			} else if (data.error === 'DAILY_LIVE_CAP_REACHED') {
				alert('شما امروز به سقف مسابقات زنده رسیده‌اید. فردا دوباره تلاش کنید!');
			}
		} catch (err) {
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
			} else if (r.status === 429) {
				alert('شما امروز به سقف مسابقات زنده رسیده‌اید. فردا دوباره تلاش کنید!');
			}
		} catch (err) {
			console.error('Failed to join random:', err);
		} finally {
			setLoading(null);
		}
	};

	const inviteLink = inviteId ? `${location.origin}${location.pathname}?invite=${inviteId}${getEitaaParams()}` : '';

	return (
		<div className="card">
			<div className="h1">👑 شطرنج هخامنشی 👑</div>
			<p style={{ textAlign: 'center', marginBottom: '32px', fontSize: '18px', color: 'var(--gold-light)' }}>
				بازی شطرنج با تم باستانی ایران
			</p>

			{userInfo && (
				<div className="user-stats" style={{ marginBottom: '24px', textAlign: 'center' }}>
					<div style={{ display: 'inline-flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
						{userInfo.avatarUrl && (
							<img src={userInfo.avatarUrl} alt={userInfo.name} className="avatar-small" />
						)}
						<span style={{ fontWeight: 600, fontSize: '18px' }}>{userInfo.name}</span>
						<span className="coins" style={{ fontSize: '16px' }}>🪙 {userInfo.coins} سکه</span>
						<span className="level" style={{ fontSize: '16px' }}>⭐ سطح {userInfo.level}</span>
					</div>
				</div>
			)}

			<div className="grid home-grid" style={{ marginTop: '24px' }}>
				<div className="col-4">
					<div className="card">
						<h3>🎮 تک‌نفره</h3>
						<p>بازی با هوش مصنوعی در ۵ سطح مختلف. هر سطح سکه‌های بیشتری به برنده می‌دهد.</p>
						<button onClick={() => onStart({ name: 'play', mode: 'single' })} disabled={loading !== null}>
							شروع بازی
						</button>
					</div>
				</div>
				<div className="col-4">
					<div className="card">
						<h3>👥 دعوت دوستان</h3>
						<p>ساخت لینک دعوت و ارسال در ایتا. برنده ۳۰ سکه دریافت می‌کند.</p>
						{!inviteId ? (
							<button onClick={startInvite} disabled={loading !== null}>
								{loading === 'invite' ? 'در حال ساخت...' : 'ساخت لینک دعوت'}
							</button>
						) : (
							<div>
								<div className="tag" style={{ direction: 'ltr', wordBreak: 'break-all', marginBottom: '12px' }}>
									{inviteLink}
								</div>
								<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
									<button onClick={() => navigator.clipboard.writeText(inviteLink)}>
										📋 کپی لینک
									</button>
									<button onClick={async () => {
										try {
											if (navigator.share) {
												await navigator.share({
													title: 'دعوت به بازی شطرنج هخامنشی',
													text: 'بیا با هم بازی کنیم! 👑♟️',
													url: inviteLink
												});
											} else {
												await navigator.clipboard.writeText(inviteLink);
												alert('لینک در کلیپ‌بورد کپی شد');
											}
										} catch (e) {
											console.error('share failed', e);
										}
									}}>
										🔗 اشتراک‌گذاری
									</button>
								</div>
								<button
									onClick={() => setInviteId(null)}
									style={{ marginTop: '8px', background: 'var(--panel)', borderColor: 'var(--accent)' }}
								>
									لغو
								</button>
							</div>
						)}
					</div>
				</div>
				<div className="col-4">
					<div className="card">
						<h3>🎲 رقیب شانسی</h3>
						<p>پیدا کردن حریف ناشناس با نمایش اسم و عکس. برنده ۴۰ سکه دریافت می‌کند.</p>
						<button onClick={joinRandom} disabled={loading !== null}>
							{loading === 'random' ? 'در حال جستجو...' : 'پیدا کردن حریف'}
						</button>
					</div>
				</div>
			</div>

			<div style={{ marginTop: '32px', textAlign: 'center' }}>
				<div className="tag" style={{ margin: '8px' }}>
					ورود: بدون ثبت‌نام (از ایتا)
				</div>
				<div className="tag" style={{ margin: '8px' }}>
					هر ۱۰۰ سکه = یک سطح (حداکثر سطح ۳۰)
				</div>
				<div className="tag" style={{ margin: '8px' }}>
					حداکثر ۱۰ مسابقه زنده در روز
				</div>
			</div>
		</div>
	);
};

function getEitaaParams(): string {
	const params = new URLSearchParams(location.search);
	const parts: string[] = [];
	if (params.get('eitaa_id')) parts.push(`eitaa_id=${encodeURIComponent(params.get('eitaa_id')!)}`);
	if (params.get('name')) parts.push(`name=${encodeURIComponent(params.get('name')!)}`);
	if (params.get('avatar_url')) parts.push(`avatar_url=${encodeURIComponent(params.get('avatar_url')!)}`);
	return parts.length > 0 ? `&${parts.join('&')}` : '';
}



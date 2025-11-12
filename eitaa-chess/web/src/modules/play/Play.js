import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { makeInitialBoard, loadBoardFromFEN, moveOnBoard, serializeFEN, getLegalMoves, getGameStatus, getAllPieces, getPieceAt } from './chessCore';
import { getAIMove } from './ai';
import { cannedMessages } from './canned';
const INITIAL_TIME = 10 * 60; // 10 minutes
const INCREMENT = 2; // 2 seconds per move
export const Play = ({ route, goHome, socket, userInfo }) => {
    const [board, setBoard] = useState(() => makeInitialBoard());
    const [selected, setSelected] = useState(null);
    const [status, setStatus] = useState('در حال آماده‌سازی…');
    const [aiLevel, setAiLevel] = useState(3);
    const [opponent, setOpponent] = useState(null);
    const [isMyTurn, setIsMyTurn] = useState(true);
    const [myColor, setMyColor] = useState('w');
    const [legalMoves, setLegalMoves] = useState([]);
    const [gameOver, setGameOver] = useState(null);
    const [timer, setTimer] = useState(() => ({
        white: INITIAL_TIME,
        black: INITIAL_TIME,
        lastUpdate: Date.now(),
        turn: 'w'
    }));
    const [promotionSquare, setPromotionSquare] = useState(null);
    const isMultiplayer = route.mode === 'invite' || route.mode === 'random';
    const gameStatus = getGameStatus(board);
    // Timer effect
    useEffect(() => {
        if (gameOver || !isMultiplayer)
            return;
        const interval = setInterval(() => {
            setTimer((t) => {
                const now = Date.now();
                const elapsed = Math.floor((now - t.lastUpdate) / 1000);
                if (elapsed === 0)
                    return t;
                const newTimer = { ...t };
                if (t.turn === 'w') {
                    newTimer.white = Math.max(0, t.white - elapsed);
                    if (newTimer.white === 0) {
                        setGameOver({ winner: 'b', reason: 'زمان تمام شد' });
                    }
                }
                else {
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
        }
        else {
            setStatus('در حال ساخت مسابقه…');
        }
        const onLive = (data) => {
            setStatus('بازی شروع شد!');
            // Determine my color - we'll get this from server or determine from opponent
            const params = new URLSearchParams(location.search);
            const myEitaaId = params.get('eitaa_id');
            // Server will tell us via opponent info which side we are
        };
        const onMove = ({ move, fen, turn }) => {
            // Load board from FEN received from server
            if (fen) {
                const loaded = loadBoardFromFEN(fen);
                setBoard(loaded);
            }
            else {
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
        const onOpponent = (data) => {
            setOpponent({ name: data.name, avatarUrl: data.avatarUrl });
            // Set my color from server
            if (data.myColor) {
                setMyColor(data.myColor);
                setIsMyTurn(data.myColor === 'w'); // White starts
            }
        };
        const onFinished = (result) => {
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
            }
            else if (route.mode === 'single' && gameStatus.winner === 'w') {
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
        }
        else if (gameStatus.isStalemate || gameStatus.isDraw) {
            setGameOver({ reason: gameStatus.isStalemate ? 'پات' : 'مساوی' });
        }
        else if (gameStatus.isCheck) {
            setStatus('کیش!');
        }
        else {
            if (!gameOver) {
                setStatus(isMyTurn ? 'نوبت شما' : 'نوبت حریف');
            }
        }
    }, [gameStatus, isMyTurn, isMultiplayer, route.matchId, route.mode, aiLevel, socket, gameOver]);
    // Update legal moves when selection changes
    useEffect(() => {
        if (selected) {
            setLegalMoves(getLegalMoves(board, selected));
        }
        else {
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
                        const result = moveOnBoard(board, move.from, move.to, move.promotion);
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
    const doMove = useCallback((from, to, promotion) => {
        if (!isMyTurn && isMultiplayer)
            return;
        if (gameOver)
            return;
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
    }, [board, isMyTurn, isMultiplayer, route.matchId, socket, gameStatus.turn, gameOver]);
    const onSquareClick = (square) => {
        if (gameOver)
            return;
        if (!isMyTurn && isMultiplayer)
            return;
        if (selected === null) {
            const piece = getPieceAt(board, square);
            if (piece && ((piece.startsWith('w') && gameStatus.turn === 'w') || (piece.startsWith('b') && gameStatus.turn === 'b'))) {
                setSelected(square);
            }
        }
        else {
            if (selected === square) {
                setSelected(null);
            }
            else if (legalMoves.includes(square)) {
                doMove(selected, square);
            }
            else {
                // Try selecting new piece
                const piece = getPieceAt(board, square);
                if (piece && ((piece.startsWith('w') && gameStatus.turn === 'w') || (piece.startsWith('b') && gameStatus.turn === 'b'))) {
                    setSelected(square);
                }
                else {
                    setSelected(null);
                }
            }
        }
    };
    const handlePromotion = (promo) => {
        if (!promotionSquare || !selected)
            return;
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
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    return (_jsxs("div", { className: "play-container", children: [_jsxs("div", { className: "play-header", children: [_jsx("button", { onClick: goHome, className: "btn-back", children: "\u2190 \u062E\u0627\u0646\u0647" }), _jsx("div", { className: "play-title", children: "\u0634\u0637\u0631\u0646\u062C \u0647\u062E\u0627\u0645\u0646\u0634\u06CC" }), userInfo && (_jsxs("div", { className: "user-badge", children: [userInfo.avatarUrl && (_jsx("img", { src: userInfo.avatarUrl, alt: userInfo.name, className: "avatar-small" })), _jsx("span", { children: userInfo.name }), _jsxs("span", { className: "coins", children: ["\uD83E\uDE99 ", userInfo.coins] }), _jsxs("span", { className: "level", children: ["\u2B50 ", userInfo.level] })] }))] }), _jsxs("div", { className: "play-grid", children: [_jsxs("div", { className: "play-main", children: [_jsxs("div", { className: "game-info", children: [opponent && (_jsxs("div", { className: "opponent-info", children: [opponent.avatarUrl && (_jsx("img", { src: opponent.avatarUrl, alt: opponent.name, className: "avatar" })), _jsxs("div", { children: [_jsx("div", { className: "opponent-name", children: opponent.name }), isMultiplayer && (_jsx("div", { className: "timer", children: myColor === 'b' ? formatTime(timer.white) : formatTime(timer.black) }))] })] })), _jsxs("div", { className: "status-bar", children: [_jsx("div", { className: `status ${gameOver ? 'game-over' : ''}`, children: status }), route.mode === 'single' && (_jsxs("select", { value: aiLevel, onChange: (e) => setAiLevel(Number(e.target.value)), className: "level-select", disabled: !isMyTurn, children: [_jsx("option", { value: 1, children: "\u0622\u0633\u0627\u0646" }), _jsx("option", { value: 2, children: "\u0645\u062A\u0648\u0633\u0637-" }), _jsx("option", { value: 3, children: "\u0645\u062A\u0648\u0633\u0637" }), _jsx("option", { value: 4, children: "\u0633\u062E\u062A" }), _jsx("option", { value: 5, children: "\u062E\u06CC\u0644\u06CC \u0633\u062E\u062A" })] })), isMultiplayer && (_jsx("div", { className: "timer", children: myColor === 'w' ? formatTime(timer.white) : formatTime(timer.black) }))] })] }), _jsx(Board, { board: board, selected: selected, legalMoves: legalMoves, onSquareClick: onSquareClick, flipped: myColor === 'b' }), promotionSquare && (_jsxs("div", { className: "promotion-modal", children: [_jsx("div", { className: "promotion-title", children: "\u0627\u0646\u062A\u062E\u0627\u0628 \u0645\u0647\u0631\u0647:" }), _jsx("div", { className: "promotion-pieces", children: ['q', 'r', 'b', 'n'].map((p) => (_jsx("button", { onClick: () => handlePromotion(p), className: "promotion-btn", children: pieceToGlyph(gameStatus.turn === 'w' ? p.toUpperCase() : p) }, p))) })] })), gameOver && (_jsx("div", { className: "game-over-modal", children: _jsxs("div", { className: "game-over-content", children: [_jsx("div", { className: "game-over-title", children: gameOver.winner
                                                ? `برنده: ${gameOver.winner === 'w' ? 'سفید' : 'سیاه'}`
                                                : 'مساوی' }), _jsx("div", { className: "game-over-reason", children: gameOver.reason }), _jsx("button", { onClick: goHome, className: "btn-primary", children: "\u0628\u0627\u0632\u06AF\u0634\u062A \u0628\u0647 \u062E\u0627\u0646\u0647" })] }) })), _jsx("div", { className: "game-actions", children: _jsx("button", { onClick: resign, className: "btn-resign", disabled: !!gameOver, children: "\u0627\u0633\u062A\u0639\u0641\u0627" }) })] }), _jsx("div", { className: "play-sidebar", children: _jsxs("div", { className: "card", children: [_jsx("h3", { children: "\u067E\u06CC\u0627\u0645\u200C\u0647\u0627\u06CC \u0622\u0645\u0627\u062F\u0647" }), _jsx("div", { className: "canned-messages", children: Object.entries(cannedMessages).map(([group, items]) => (_jsxs("div", { className: "canned-group", children: [_jsx("div", { className: "canned-group-title", children: group }), items.map((m) => (_jsx("button", { onClick: () => route.matchId &&
                                                    socket.emit('chat:canned', { matchId: route.matchId, code: m.code }), className: "canned-btn", disabled: !isMultiplayer, children: m.text }, m.code)))] }, group))) })] }) })] })] }));
};
const Board = ({ board, selected, legalMoves, onSquareClick, flipped }) => {
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
            squares.push(_jsxs("div", { className: `square ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''} ${isLegal ? 'legal' : ''}`, onClick: () => onSquareClick(square), children: [piece && _jsx("div", { className: "piece", children: pieceToGlyph(piece.piece) }), isLegal && _jsx("div", { className: "legal-marker" })] }, square));
        }
    }
    return _jsx("div", { className: "board", children: squares });
};
function pieceToGlyph(piece) {
    const map = {
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

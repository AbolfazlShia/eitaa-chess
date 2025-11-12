import { Chess } from 'chess.js';
export function makeInitialBoard() {
    const game = new Chess();
    return { game, fen: game.fen() };
}
export function loadBoardFromFEN(fen) {
    const game = new Chess(fen);
    return { game, fen: game.fen() };
}
export function moveOnBoard(board, from, to, promotion) {
    try {
        const game = new Chess(board.fen);
        const move = game.move({
            from: from,
            to: to,
            promotion: promotion || 'q'
        });
        if (!move) {
            return { ok: false, board: null, error: 'INVALID_MOVE' };
        }
        return { ok: true, board: { game, fen: game.fen() } };
    }
    catch (err) {
        return { ok: false, board: null, error: 'INVALID_MOVE' };
    }
}
export function getLegalMoves(board, square) {
    try {
        const game = new Chess(board.fen);
        if (square) {
            return game.moves({ square: square, verbose: true }).map(m => m.to);
        }
        return game.moves({ verbose: true }).map(m => m.to);
    }
    catch {
        return [];
    }
}
export function getGameStatus(board) {
    const game = new Chess(board.fen);
    const isCheck = game.isCheck();
    const isCheckmate = game.isCheckmate();
    const isStalemate = game.isStalemate();
    const isDraw = game.isDraw();
    const turn = game.turn() === 'w' ? 'w' : 'b';
    return {
        isCheck,
        isCheckmate,
        isStalemate,
        isDraw,
        turn,
        winner: isCheckmate ? (turn === 'w' ? 'b' : 'w') : undefined
    };
}
export function getPieceAt(board, square) {
    try {
        const game = new Chess(board.fen);
        const piece = game.get(square);
        return piece ? `${piece.color}${piece.type}` : null;
    }
    catch {
        return null;
    }
}
export function getAllPieces(board) {
    try {
        const game = new Chess(board.fen);
        const pieces = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = String.fromCharCode(97 + c) + (8 - r);
                const piece = game.get(square);
                if (piece) {
                    pieces.push({
                        square,
                        piece: `${piece.color}${piece.type}`
                    });
                }
            }
        }
        return pieces;
    }
    catch {
        return [];
    }
}
export function serializeFEN(board) {
    return board.fen;
}

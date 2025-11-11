import { Chess, type Square } from 'chess.js';

export type BoardState = {
	game: Chess;
	fen: string;
};

export function makeInitialBoard(): BoardState {
	const game = new Chess();
	return { game, fen: game.fen() };
}

export function loadBoardFromFEN(fen: string): BoardState {
	const game = new Chess(fen);
	return { game, fen: game.fen() };
}

export function moveOnBoard(
	board: BoardState,
	from: string,
	to: string,
	promotion?: 'q' | 'r' | 'b' | 'n'
): { ok: boolean; board: BoardState | null; error?: string } {
	try {
		const game = new Chess(board.fen);
		const move = game.move({
			from: from as Square,
			to: to as Square,
			promotion: promotion || 'q'
		});
		if (!move) {
			return { ok: false, board: null, error: 'INVALID_MOVE' };
		}
		return { ok: true, board: { game, fen: game.fen() } };
	} catch (err) {
		return { ok: false, board: null, error: 'INVALID_MOVE' };
	}
}

export function getLegalMoves(board: BoardState, square?: string): string[] {
	try {
		const game = new Chess(board.fen);
		if (square) {
			return game.moves({ square: square as Square, verbose: true }).map(m => m.to);
		}
		return game.moves({ verbose: true }).map(m => m.to);
	} catch {
		return [];
	}
}

export function getGameStatus(board: BoardState): {
	isCheck: boolean;
	isCheckmate: boolean;
	isStalemate: boolean;
	isDraw: boolean;
	turn: 'w' | 'b';
	winner?: 'w' | 'b';
} {
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

export function getPieceAt(board: BoardState, square: string): string | null {
	try {
		const game = new Chess(board.fen);
		const piece = game.get(square as Square);
		return piece ? `${piece.color}${piece.type}` : null;
	} catch {
		return null;
	}
}

export function getAllPieces(board: BoardState): Array<{ square: string; piece: string }> {
	try {
		const game = new Chess(board.fen);
		const pieces: Array<{ square: string; piece: string }> = [];
		for (let r = 0; r < 8; r++) {
			for (let c = 0; c < 8; c++) {
				const square = String.fromCharCode(97 + c) + (8 - r);
				const piece = game.get(square as Square);
				if (piece) {
					pieces.push({
						square,
						piece: `${piece.color}${piece.type}`
					});
				}
			}
		}
		return pieces;
	} catch {
		return [];
	}
}

export function serializeFEN(board: BoardState): string {
	return board.fen;
}

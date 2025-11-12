import { Chess } from 'chess.js';
const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};
function evaluatePosition(game) {
    if (game.isCheckmate()) {
        return game.turn() === 'w' ? -100000 : 100000;
    }
    if (game.isDraw() || game.isStalemate()) {
        return 0;
    }
    let score = 0;
    const board = game.board();
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece) {
                const value = PIECE_VALUES[piece.type] || 0;
                score += piece.color === 'w' ? value : -value;
            }
        }
    }
    // Simple positional bonuses
    if (game.isCheck()) {
        score += game.turn() === 'w' ? -50 : 50;
    }
    return score;
}
function minimax(game, depth, alpha, beta, maximizing) {
    if (depth === 0 || game.isGameOver()) {
        return evaluatePosition(game);
    }
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) {
        return evaluatePosition(game);
    }
    if (maximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const gameCopy = new Chess(game.fen());
            gameCopy.move(move);
            const eval_ = minimax(gameCopy, depth - 1, alpha, beta, false);
            maxEval = Math.max(maxEval, eval_);
            alpha = Math.max(alpha, eval_);
            if (beta <= alpha)
                break; // alpha-beta pruning
        }
        return maxEval;
    }
    else {
        let minEval = Infinity;
        for (const move of moves) {
            const gameCopy = new Chess(game.fen());
            gameCopy.move(move);
            const eval_ = minimax(gameCopy, depth - 1, alpha, beta, true);
            minEval = Math.min(minEval, eval_);
            beta = Math.min(beta, eval_);
            if (beta <= alpha)
                break;
        }
        return minEval;
    }
}
function findBestMove(game, depth) {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0)
        return null;
    const isMaximizing = game.turn() === 'b';
    let bestMove = null;
    let bestEval = isMaximizing ? -Infinity : Infinity;
    for (const move of moves) {
        const gameCopy = new Chess(game.fen());
        gameCopy.move(move);
        const eval_ = minimax(gameCopy, depth - 1, -Infinity, Infinity, !isMaximizing);
        if (isMaximizing) {
            if (eval_ > bestEval) {
                bestEval = eval_;
                bestMove = move;
            }
        }
        else {
            if (eval_ < bestEval) {
                bestEval = eval_;
                bestMove = move;
            }
        }
    }
    return bestMove || moves[0] || null;
}
export function getAIMove(board, level) {
    return new Promise((resolve) => {
        // Use setTimeout to avoid blocking UI
        setTimeout(() => {
            try {
                const game = new Chess(board.fen);
                if (game.isGameOver()) {
                    resolve(null);
                    return;
                }
                // Level-based depth and randomness
                let depth = 1;
                let randomness = 0.3;
                switch (level) {
                    case 1:
                        depth = 1;
                        randomness = 0.5; // 50% random moves
                        break;
                    case 2:
                        depth = 2;
                        randomness = 0.3;
                        break;
                    case 3:
                        depth = 2;
                        randomness = 0.1;
                        break;
                    case 4:
                        depth = 3;
                        randomness = 0.05;
                        break;
                    case 5:
                        depth = 4;
                        randomness = 0;
                        break;
                }
                const moves = game.moves({ verbose: true });
                if (moves.length === 0) {
                    resolve(null);
                    return;
                }
                // Sometimes make a random move for lower levels
                if (Math.random() < randomness && level < 5) {
                    const randomMove = moves[Math.floor(Math.random() * moves.length)];
                    resolve({
                        from: randomMove.from,
                        to: randomMove.to,
                        promotion: randomMove.promotion
                    });
                    return;
                }
                const bestMove = findBestMove(game, depth);
                if (bestMove) {
                    resolve({
                        from: bestMove.from,
                        to: bestMove.to,
                        promotion: bestMove.promotion
                    });
                }
                else {
                    // Fallback to first move
                    const fallback = moves[0];
                    resolve({
                        from: fallback.from,
                        to: fallback.to,
                        promotion: fallback.promotion
                    });
                }
            }
            catch (err) {
                console.error('AI error:', err);
                resolve(null);
            }
        }, Math.max(300, 800 - level * 100)); // Faster for lower levels
    });
}

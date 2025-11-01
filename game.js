// Game state
let board = [];
let currentPlayer = 'black';
let selectedSquare = null;
let selectedCapturedPiece = null;
let moveHistory = [];
let isDropping = false;
let pieceToDrop = null;
let capturedPieces = {
    black: [],
    white: []
};

// Piece symbols (English names)
const PIECES = {
    king: { black: 'K', white: 'K', value: 0 },
    rook: { black: 'R', white: 'R', value: 5 },
    bishop: { black: 'B', white: 'B', value: 5 },
    gold: { black: 'G', white: 'G', value: 2 },
    silver: { black: 'S', white: 'S', value: 1 },
    knight: { black: 'N', white: 'N', value: 1 },
    lance: { black: 'L', white: 'L', value: 1 },
    pawn: { black: 'P', white: 'P', value: 1 }
};

const PROMOTED_PIECES = {
    rook: { black: 'R+', white: 'R+', value: 7 },
    bishop: { black: 'B+', white: 'B+', value: 7 },
    silver: { black: 'S+', white: 'S+', value: 2 },
    knight: { black: 'N+', white: 'N+', value: 2 },
    lance: { black: 'L+', white: 'L+', value: 2 },
    pawn: { black: 'P+', white: 'P+', value: 2 }
};

// Initialize board
function initBoard() {
    board = Array(9).fill(null).map(() => Array(9).fill(null));
    
    // Set up initial pieces
    const initialSetup = [
        ['lance', 'knight', 'silver', 'gold', 'king', 'gold', 'silver', 'knight', 'lance'],
        [null, 'rook', null, null, null, null, null, 'bishop', null],
        ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn']
    ];
    
    // Place black pieces (bottom)
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 9; col++) {
            if (initialSetup[row][col]) {
                board[8 - row][col] = {
                    type: initialSetup[row][col],
                    color: 'black',
                    promoted: false
                };
            }
        }
    }
    
    // Place white pieces (top)
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 9; col++) {
            if (initialSetup[row][col]) {
                board[row][col] = {
                    type: initialSetup[row][col],
                    color: 'white',
                    promoted: false
                };
            }
        }
    }
    
    renderBoard();
    updateCapturedPieces();
    updateStatus();
}

// Render board
function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.dataset.row = row;
            square.dataset.col = col;
            
            const piece = board[row][col];
            if (piece) {
                square.classList.add('piece', piece.color);
                const pieceType = piece.promoted ? PROMOTED_PIECES[piece.type] : PIECES[piece.type];
                square.textContent = pieceType[piece.color];
                if (piece.promoted) {
                    square.classList.add('promoted');
                }
            }
            
            square.addEventListener('click', () => handleSquareClick(row, col));
            boardElement.appendChild(square);
        }
    }
}

// Handle square click
function handleSquareClick(row, col) {
    if (isDropping) {
        handleDrop(row, col);
        return;
    }
    
    const piece = board[row][col];
    
    if (selectedSquare) {
        const [selRow, selCol] = selectedSquare;
        const selectedPiece = board[selRow][selCol];
        
        if (row === selRow && col === selCol) {
            // Deselect
            selectedSquare = null;
            clearValidMoves();
            return;
        }
        
        if (piece && piece.color === currentPlayer) {
            // Select different piece
            selectedSquare = [row, col];
            clearValidMoves();
            showValidMoves(row, col);
            return;
        }
        
        // Try to move
        if (isValidMove(selRow, selCol, row, col)) {
            makeMove(selRow, selCol, row, col);
        }
    } else {
        if (piece && piece.color === currentPlayer) {
            selectedSquare = [row, col];
            showValidMoves(row, col);
        }
    }
}

// Check if move is valid
function isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    if (!piece || piece.color !== currentPlayer) return false;
    
    const targetPiece = board[toRow][toCol];
    if (targetPiece && targetPiece.color === piece.color) return false;
    
    // Check piece-specific movement rules
    const moves = getValidMoves(fromRow, fromCol);
    return moves.some(([r, c]) => r === toRow && c === toCol);
}

// Get valid moves for a piece
function getValidMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return [];
    
    const moves = [];
    
    // Handle promoted rook and bishop specially
    if (piece.promoted && (piece.type === 'rook' || piece.type === 'bishop')) {
        // First, get ranging moves (original piece type)
        const rangingDirections = piece.type === 'rook' 
            ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
            : [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        for (const [dr, dc] of rangingDirections) {
            let newRow = row + dr;
            let newCol = col + dc;
            while (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
                const targetPiece = board[newRow][newCol];
                if (targetPiece && targetPiece.color === piece.color) break;
                moves.push([newRow, newCol]);
                if (targetPiece) break;
                newRow += dr;
                newCol += dc;
            }
        }
        
        // Then, add king moves (one square in any direction)
        const kingDirections = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        for (const [dr, dc] of kingDirections) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
                const targetPiece = board[newRow][newCol];
                if (!targetPiece || targetPiece.color !== piece.color) {
                    // Avoid duplicates
                    if (!moves.some(([r, c]) => r === newRow && c === newCol)) {
                        moves.push([newRow, newCol]);
                    }
                }
            }
        }
    } else {
        // Regular pieces
        const directions = getPieceDirections(piece, row, col);
        
        for (const [dr, dc] of directions) {
            if (piece.type === 'rook' || piece.type === 'bishop' || 
                (piece.promoted && (piece.type === 'rook' || piece.type === 'bishop'))) {
                // Ranging pieces
                let newRow = row + dr;
                let newCol = col + dc;
                while (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
                    const targetPiece = board[newRow][newCol];
                    if (targetPiece && targetPiece.color === piece.color) break;
                    moves.push([newRow, newCol]);
                    if (targetPiece) break; // Can capture but can't move further
                    newRow += dr;
                    newCol += dc;
                }
            } else {
                // Single-step pieces
                const newRow = row + dr;
                const newCol = col + dc;
                if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
                    const targetPiece = board[newRow][newCol];
                    if (!targetPiece || targetPiece.color !== piece.color) {
                        moves.push([newRow, newCol]);
                    }
                }
            }
        }
    }
    
    return moves.filter(([r, c]) => {
        // Check if move would leave king in check
        const tempBoard = JSON.parse(JSON.stringify(board));
        const tempPiece = tempBoard[row][col];
        tempBoard[r][c] = tempPiece;
        tempBoard[row][col] = null;
        
        return !isInCheck(piece.color, tempBoard);
    });
}

// Get piece movement directions
function getPieceDirections(piece, row, col) {
    const isBlack = piece.color === 'black';
    const forward = isBlack ? -1 : 1;
    const backward = isBlack ? 1 : -1;
    
    if (piece.promoted) {
        switch (piece.type) {
            case 'pawn':
            case 'lance':
            case 'knight':
            case 'silver':
                // Promoted pieces move like gold
                return [
                    [forward, -1], [forward, 0], [forward, 1],
                    [0, -1], [0, 1],
                    [backward, 0]
                ];
            case 'bishop':
                // Promoted bishop: diagonal moves are handled separately in getValidMoves
                return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            case 'rook':
                // Promoted rook: horizontal/vertical moves are handled separately in getValidMoves
                return [[-1, 0], [1, 0], [0, -1], [0, 1]];
        }
    }
    
    switch (piece.type) {
        case 'king':
            return [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        case 'rook':
            return [[-1, 0], [1, 0], [0, -1], [0, 1]];
        case 'bishop':
            return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        case 'gold':
            return [[forward, -1], [forward, 0], [forward, 1], [0, -1], [0, 1], [backward, 0]];
        case 'silver':
            return [[forward, -1], [forward, 0], [forward, 1], [backward, -1], [backward, 1]];
        case 'knight':
            return [[forward * 2, -1], [forward * 2, 1]];
        case 'lance':
            return [[forward, 0]];
        case 'pawn':
            return [[forward, 0]];
        default:
            return [];
    }
}

// Check if promotion is possible
function canPromote(piece, fromRow, toRow) {
    if (piece.promoted) return false;
    
    const promotionZone = piece.color === 'black' ? [0, 1, 2] : [6, 7, 8];
    
    if (promotionZone.includes(fromRow) || promotionZone.includes(toRow)) {
        if (piece.type === 'king' || piece.type === 'gold') return false;
        return true;
    }
    return false;
}

// Make a move
function makeMove(fromRow, fromCol, toRow, toCol, promotePiece = null) {
    const piece = board[fromRow][fromCol];
    const capturedPiece = board[toRow][toCol];
    
    // Check if promotion is possible
    if (canPromote(piece, fromRow, toRow) && promotePiece === null) {
        // Show promotion modal and wait for user decision
        showPromotionModal(fromRow, fromCol, toRow, toCol);
        return;
    }
    
    if (promotePiece === true) {
        piece.promoted = true;
    }
    
    // Handle knight promotion (must promote when entering last 2 ranks)
    if (piece.type === 'knight' && !piece.promoted) {
        const lastRanks = piece.color === 'black' ? [0, 1] : [7, 8];
        if (lastRanks.includes(toRow)) {
            piece.promoted = true;
        }
    }
    
    // Handle lance/pawn promotion (must promote when entering last rank)
    if ((piece.type === 'lance' || piece.type === 'pawn') && !piece.promoted) {
        const lastRank = piece.color === 'black' ? 0 : 8;
        if (toRow === lastRank) {
            piece.promoted = true;
        }
    }
    
    // Capture piece
    if (capturedPiece) {
        capturedPiece.promoted = false; // Reset promotion when captured
        capturedPieces[currentPlayer].push(capturedPiece.type);
    }
    
    // Move piece
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;
    
    // Save move history
    moveHistory.push({
        from: [fromRow, fromCol],
        to: [toRow, toCol],
        piece: JSON.parse(JSON.stringify(piece)),
        captured: capturedPiece ? JSON.parse(JSON.stringify(capturedPiece)) : null
    });
    
    selectedSquare = null;
    clearValidMoves();
    
    // Switch player
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    
    renderBoard();
    updateCapturedPieces();
    updateStatus();
    
    // Check for checkmate
    if (isCheckmate(currentPlayer)) {
        const winner = currentPlayer === 'black' ? 'White' : 'Black';
        document.getElementById('game-status').textContent = `${winner} wins by checkmate!`;
    } else if (isInCheck(currentPlayer)) {
        document.getElementById('game-status').textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check!`;
    }
}

// Check if king is in check
function isInCheck(color, customBoard = null) {
    const b = customBoard || board;
    let kingPos = null;
    
    // Find king
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const piece = b[row][col];
            if (piece && piece.type === 'king' && piece.color === color) {
                kingPos = [row, col];
                break;
            }
        }
        if (kingPos) break;
    }
    
    if (!kingPos) return false;
    
    // Check if any opponent piece can attack the king
    const opponentColor = color === 'black' ? 'white' : 'black';
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const piece = b[row][col];
            if (piece && piece.color === opponentColor) {
                const moves = getValidMovesForPiece(piece, row, col, b);
                if (moves.some(([r, c]) => r === kingPos[0] && c === kingPos[1])) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// Get valid moves for a piece (without check validation)
function getValidMovesForPiece(piece, row, col, b) {
    const moves = [];
    
    // Handle promoted rook and bishop specially
    if (piece.promoted && (piece.type === 'rook' || piece.type === 'bishop')) {
        // First, get ranging moves (original piece type)
        const rangingDirections = piece.type === 'rook' 
            ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
            : [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        for (const [dr, dc] of rangingDirections) {
            let newRow = row + dr;
            let newCol = col + dc;
            while (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
                const targetPiece = b[newRow][newCol];
                if (targetPiece && targetPiece.color === piece.color) break;
                moves.push([newRow, newCol]);
                if (targetPiece) break;
                newRow += dr;
                newCol += dc;
            }
        }
        
        // Then, add king moves (one square in any direction)
        const kingDirections = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        for (const [dr, dc] of kingDirections) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
                const targetPiece = b[newRow][newCol];
                if (!targetPiece || targetPiece.color !== piece.color) {
                    if (!moves.some(([r, c]) => r === newRow && c === newCol)) {
                        moves.push([newRow, newCol]);
                    }
                }
            }
        }
    } else {
        // Regular pieces
        const directions = getPieceDirections(piece, row, col);
        
        for (const [dr, dc] of directions) {
            if (piece.type === 'rook' || piece.type === 'bishop' || 
                (piece.promoted && (piece.type === 'rook' || piece.type === 'bishop'))) {
                let newRow = row + dr;
                let newCol = col + dc;
                while (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
                    const targetPiece = b[newRow][newCol];
                    if (targetPiece && targetPiece.color === piece.color) break;
                    moves.push([newRow, newCol]);
                    if (targetPiece) break;
                    newRow += dr;
                    newCol += dc;
                }
            } else {
                const newRow = row + dr;
                const newCol = col + dc;
                if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
                    const targetPiece = b[newRow][newCol];
                    if (!targetPiece || targetPiece.color !== piece.color) {
                        moves.push([newRow, newCol]);
                    }
                }
            }
        }
    }
    
    return moves;
}

// Check if checkmate
function isCheckmate(color) {
    if (!isInCheck(color)) return false;
    
    // Check if any move can get out of check
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const piece = board[row][col];
            if (piece && piece.color === color) {
                const moves = getValidMoves(row, col);
                if (moves.length > 0) return false;
            }
        }
    }
    
    // Check if dropping a piece can help
    const pieces = capturedPieces[color];
    if (pieces.length > 0) {
        // Simplified: if we have captured pieces, might be able to block
        // For full implementation, would need to check all drop positions
    }
    
    return true;
}

// Show valid moves
function showValidMoves(row, col) {
    const moves = getValidMoves(row, col);
    moves.forEach(([r, c]) => {
        const square = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (square) {
            square.classList.add('valid-move');
        }
    });
    
    const selectedSquareEl = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (selectedSquareEl) {
        selectedSquareEl.classList.add('selected');
    }
}

// Clear valid moves
function clearValidMoves() {
    document.querySelectorAll('.square').forEach(square => {
        square.classList.remove('valid-move', 'selected');
    });
}

// Update captured pieces display
function updateCapturedPieces() {
    const blackCaptured = document.getElementById('black-captured');
    const whiteCaptured = document.getElementById('white-captured');
    
    blackCaptured.innerHTML = '';
    whiteCaptured.innerHTML = '';
    
    // Count pieces
    const blackCounts = {};
    const whiteCounts = {};
    
    capturedPieces.black.forEach(type => {
        blackCounts[type] = (blackCounts[type] || 0) + 1;
    });
    
    capturedPieces.white.forEach(type => {
        whiteCounts[type] = (whiteCounts[type] || 0) + 1;
    });
    
    // Display black captured pieces
    Object.entries(blackCounts).forEach(([type, count]) => {
        const pieceDiv = document.createElement('div');
        pieceDiv.className = 'captured-piece';
        pieceDiv.textContent = `${PIECES[type].black}${count > 1 ? count : ''}`;
        pieceDiv.dataset.type = type;
        pieceDiv.dataset.color = 'black';
        pieceDiv.addEventListener('click', () => selectCapturedPiece(type, 'black'));
        blackCaptured.appendChild(pieceDiv);
    });
    
    // Display white captured pieces
    Object.entries(whiteCounts).forEach(([type, count]) => {
        const pieceDiv = document.createElement('div');
        pieceDiv.className = 'captured-piece';
        pieceDiv.textContent = `${PIECES[type].white}${count > 1 ? count : ''}`;
        pieceDiv.dataset.type = type;
        pieceDiv.dataset.color = 'white';
        pieceDiv.addEventListener('click', () => selectCapturedPiece(type, 'white'));
        whiteCaptured.appendChild(pieceDiv);
    });
}

// Select captured piece for dropping
function selectCapturedPiece(type, color) {
    if (color !== currentPlayer) return;
    
    const index = capturedPieces[color].indexOf(type);
    if (index === -1) return;
    
    isDropping = true;
    pieceToDrop = { type, color };
    selectedCapturedPiece = [type, color];
    
    // Highlight valid drop squares
    const validDrops = getValidDropSquares(type, color);
    validDrops.forEach(([row, col]) => {
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (square) {
            square.classList.add('valid-move');
        }
    });
    
    document.getElementById('drop-modal').classList.add('show');
    
    // Clear previous selections
    document.querySelectorAll('.captured-piece').forEach(el => {
        el.classList.remove('selected');
    });
    
    event.target.classList.add('selected');
}

// Get valid drop squares
function getValidDropSquares(type, color) {
    const squares = [];
    const promotionZone = color === 'black' ? [0, 1, 2] : [6, 7, 8];
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col]) continue; // Square occupied
            
            // Pawns can't be dropped in promotion zone or on files with friendly pawns
            if (type === 'pawn') {
                if (promotionZone.includes(row)) continue;
                
                // Check if there's already a pawn of this color in this column
                let hasPawn = false;
                for (let r = 0; r < 9; r++) {
                    const p = board[r][col];
                    if (p && p.type === 'pawn' && p.color === color && !p.promoted) {
                        hasPawn = true;
                        break;
                    }
                }
                if (hasPawn) continue;
                
                // Can't drop pawn that would immediately checkmate
                // (Simplified check - would need full validation)
            }
            
            // Knights can't be dropped in last 2 ranks
            if (type === 'knight') {
                const lastRanks = color === 'black' ? [0, 1] : [7, 8];
                if (lastRanks.includes(row)) continue;
            }
            
            // Lances can't be dropped in last rank
            if (type === 'lance') {
                const lastRank = color === 'black' ? 0 : 8;
                if (row === lastRank) continue;
            }
            
            squares.push([row, col]);
        }
    }
    
    return squares;
}

// Handle dropping a piece
function handleDrop(row, col) {
    if (!pieceToDrop) return;
    
    const validDrops = getValidDropSquares(pieceToDrop.type, pieceToDrop.color);
    if (!validDrops.some(([r, c]) => r === row && c === col)) {
        return;
    }
    
    // Remove piece from captured
    const index = capturedPieces[pieceToDrop.color].indexOf(pieceToDrop.type);
    if (index !== -1) {
        capturedPieces[pieceToDrop.color].splice(index, 1);
    }
    
    // Place piece on board
    board[row][col] = {
        type: pieceToDrop.type,
        color: pieceToDrop.color,
        promoted: false
    };
    
    // Save move
    moveHistory.push({
        drop: true,
        to: [row, col],
        piece: JSON.parse(JSON.stringify(board[row][col]))
    });
    
    // Reset drop state
    isDropping = false;
    pieceToDrop = null;
    selectedCapturedPiece = null;
    clearValidMoves();
    document.getElementById('drop-modal').classList.remove('show');
    
    // Switch player
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    
    renderBoard();
    updateCapturedPieces();
    updateStatus();
}

// Show promotion modal
let pendingMove = null;

function showPromotionModal(fromRow, fromCol, toRow, toCol) {
    pendingMove = { fromRow, fromCol, toRow, toCol };
    clearValidMoves();
    selectedSquare = null;
    const modal = document.getElementById('promotion-modal');
    modal.classList.add('show');
}

function handlePromotionDecision(promote) {
    if (pendingMove) {
        const { fromRow, fromCol, toRow, toCol } = pendingMove;
        pendingMove = null;
        document.getElementById('promotion-modal').classList.remove('show');
        makeMove(fromRow, fromCol, toRow, toCol, promote);
    }
}

// Update status
function updateStatus() {
    const playerText = currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1);
    document.getElementById('current-player').textContent = `Current Player: ${playerText}`;
    
    if (!isInCheck(currentPlayer) && !isCheckmate(currentPlayer)) {
        document.getElementById('game-status').textContent = 'Game in progress';
    }
}

// Reset game
function resetGame() {
    board = [];
    currentPlayer = 'black';
    selectedSquare = null;
    selectedCapturedPiece = null;
    moveHistory = [];
    isDropping = false;
    pieceToDrop = null;
    capturedPieces = {
        black: [],
        white: []
    };
    
    initBoard();
}

// Undo move
function undoMove() {
    if (moveHistory.length === 0) return;
    
    const lastMove = moveHistory.pop();
    
    if (lastMove.drop) {
        // Undo drop
        const [row, col] = lastMove.to;
        const piece = board[row][col];
        capturedPieces[piece.color].push(piece.type);
        board[row][col] = null;
    } else {
        // Undo regular move
        const [fromRow, fromCol] = lastMove.from;
        const [toRow, toCol] = lastMove.to;
        const piece = lastMove.piece;
        
        board[fromRow][fromCol] = piece;
        
        if (lastMove.captured) {
            board[toRow][toCol] = lastMove.captured;
            capturedPieces[currentPlayer].pop();
        } else {
            board[toRow][toCol] = null;
        }
    }
    
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    
    renderBoard();
    updateCapturedPieces();
    updateStatus();
}

// Event listeners
document.getElementById('reset-btn').addEventListener('click', resetGame);
document.getElementById('undo-btn').addEventListener('click', undoMove);
document.getElementById('cancel-drop').addEventListener('click', () => {
    isDropping = false;
    pieceToDrop = null;
    selectedCapturedPiece = null;
    clearValidMoves();
    document.getElementById('drop-modal').classList.remove('show');
    document.querySelectorAll('.captured-piece').forEach(el => {
        el.classList.remove('selected');
    });
});

document.getElementById('promote-yes').addEventListener('click', () => handlePromotionDecision(true));
document.getElementById('promote-no').addEventListener('click', () => handlePromotionDecision(false));

// Initialize game
initBoard();

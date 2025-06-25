const chessBoard = document.getElementById('chess-board');
const superpowerButton = document.getElementById('superpower-button');
const chargeBar = document.getElementById('superpower-charge');
const chargeText = document.getElementById('superpower-charge-text');
const showMovesToggle = document.getElementById('show-moves-toggle');
let superpowerActive = false;

const chargeMax = 5;
let superpowerCharge = 0;

let board, selected, turn, moveHistory;
let showMoves = false;
let highlightedMoves = [];

const PIECES = {
    white: '♙♖♘♗♕♔',
    black: '♟♜♞♝♛♚'
};

function isWhite(piece) {
    return PIECES.white.includes(piece);
}
function isBlack(piece) {
    return PIECES.black.includes(piece);
}
function isOpponent(piece, color) {
    return (color === 'white' && isBlack(piece)) || (color === 'black' && isWhite(piece));
}
function isOwn(piece, color) {
    return (color === 'white' && isWhite(piece)) || (color === 'black' && isBlack(piece));
}

function renderChessBoard(board) {
    chessBoard.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            if ((row + col) % 2 === 0) {
                square.style.backgroundColor = '#eee';
            } else {
                square.style.backgroundColor = '#ddd';
            }
            square.dataset.row = row;
            square.dataset.col = col;

            // Highlight moves if enabled
            if (showMoves && highlightedMoves.length > 0) {
                if (highlightedMoves.some(m => m.row === row && m.col === col)) {
                    if (board[row][col] && isOpponent(board[row][col], turn)) {
                        square.classList.add('highlight-capture');
                    } else {
                        square.classList.add('highlight-move');
                    }
                }
            }

            if (selected && selected.row === row && selected.col === col) {
                square.style.outline = '3px solid #4CAF50';
            }

            if (board[row][col]) {
                const piece = document.createElement('span');
                piece.classList.add('piece');
                piece.textContent = board[row][col];
                piece.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectPiece(row, col);
                });
                square.appendChild(piece);
            }

            square.addEventListener('click', () => {
                selectSquare(row, col);
            });

            chessBoard.appendChild(square);
        }
    }
}

function selectPiece(row, col) {
    const piece = board[row][col];
    if (!piece) return;
    if (!selected || isOwn(piece, turn)) {
        if (isOwn(piece, turn)) {
            selected = { row, col };
            if (showMoves) {
                highlightedMoves = getLegalMoves(row, col, board, turn, moveHistory);
            }
            renderChessBoard(board);
        }
    }
}

function selectSquare(row, col) {
    if (!selected) return;
    if (selected.row === row && selected.col === col) {
        selected = null;
        highlightedMoves = [];
        renderChessBoard(board);
        return;
    }
    const from = selected;
    const to = { row, col };
    const piece = board[from.row][from.col];
    if (!piece) return;

    console.log('Trying to move', piece, 'from', from, 'to', to);
    console.log('Target square contains:', board[to.row][to.col]);
    
    const legalMoves = getLegalMoves(from.row, from.col, board, turn, moveHistory);
    console.log('Legal moves for this piece:', legalMoves);
    
    const isLegal = legalMoves.some(m => m.row === to.row && m.col === to.col);
    console.log('Is this move legal?', isLegal);
    
    if (!isLegal) {
        renderChessBoard(board);
        const squares = chessBoard.querySelectorAll('.square');
        const idx = from.row * 8 + from.col;
        const square = squares[idx];
        if (square) {
            const pieceElem = square.querySelector('.piece');
            if (pieceElem) {
                pieceElem.classList.add('illegal-move');
                setTimeout(() => {
                    pieceElem.classList.remove('illegal-move');
                }, 700);
            }
        }
        if (board[row][col] && isOwn(board[row][col], turn)) {
            selected = { row, col };
            if (showMoves) {
                highlightedMoves = getLegalMoves(row, col, board, turn, moveHistory);
            }
            setTimeout(() => renderChessBoard(board), 700);
        } else {
            setTimeout(() => {
                selected = null;
                highlightedMoves = [];
                renderChessBoard(board);
            }, 700);
        }
        return;
    }

    // Save captured piece BEFORE moving
    const targetPiece = board[to.row][to.col];
    if (targetPiece && isOpponent(targetPiece, turn)) {
        superpowerCharge = Math.min(superpowerCharge + 1, chargeMax);
        updateSuperpowerChargeDisplay();
    }

    // Move the piece
    board[to.row][to.col] = piece;
    board[from.row][from.col] = '';
    moveHistory.push({ from, to, piece, captured: targetPiece });

    // If superpower was active, consume the charge now that a move was made
    if (superpowerActive) {
        superpowerActive = false;
        superpowerCharge = 0;
        chessBoard.classList.remove('superpower');
        updateSuperpowerChargeDisplay();
    }

    // Switch turn
    turn = turn === 'white' ? 'black' : 'white';
    selected = null;
    highlightedMoves = [];
    renderChessBoard(board);

    // If it's now black's turn, let the AI play
    if (turn === 'black') {
        setTimeout(aiMove, 600); // small delay for realism
    }
}

// --- AI OPPONENT LOGIC ---
function aiMove() {
    // Gather all legal moves for black
    let moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && isOwn(piece, 'black')) {
                const legal = getLegalMoves(r, c, board, 'black', moveHistory);
                for (const move of legal) {
                    moves.push({ from: { row: r, col: c }, to: move });
                }
            }
        }
    }
    if (moves.length === 0) {
        // No moves: checkmate or stalemate
        alert('Game over! White wins!');
        return;
    }
    // Pick a random move
    const move = moves[Math.floor(Math.random() * moves.length)];
    const from = move.from;
    const to = move.to;
    const piece = board[from.row][from.col];
    const targetPiece = board[to.row][to.col];

    // Move the piece
    board[to.row][to.col] = piece;
    board[from.row][from.col] = '';
    moveHistory.push({ from, to, piece, captured: targetPiece });

    // Switch turn back to white
    turn = 'white';
    renderChessBoard(board);
}

function updateSuperpowerChargeDisplay() {
    chargeBar.value = superpowerCharge;
    chargeText.textContent = `${superpowerCharge}/${chargeMax}`;
    
    // Update button state based on charge and superpower status
    if (superpowerActive) {
        superpowerButton.disabled = false;
        superpowerButton.textContent = 'Deactivate Superpower';
        superpowerButton.classList.add('active');
    } else {
        superpowerButton.disabled = superpowerCharge < chargeMax;
        superpowerButton.textContent = 'Activate Superpower';
        superpowerButton.classList.remove('active');
    }
}

function getLegalMoves(row, col, board, color, moveHistory, skipKingCheck) {
    const piece = board[row][col];
    if (!piece) return [];
    let moves = [];
    
    // Get base moves for the piece
    if (piece === '♙') moves = pawnMoves(row, col, board, 'white', moveHistory);
    else if (piece === '♟') moves = pawnMoves(row, col, board, 'black', moveHistory);
    else if (piece === '♖') moves = rookMoves(row, col, board, 'white');
    else if (piece === '♜') moves = rookMoves(row, col, board, 'black');
    else if (piece === '♗') moves = bishopMoves(row, col, board, 'white');
    else if (piece === '♝') moves = bishopMoves(row, col, board, 'black');
    else if (piece === '♘') moves = knightMoves(row, col, board, 'white');
    else if (piece === '♞') moves = knightMoves(row, col, board, 'black');
    else if (piece === '♕') moves = queenMoves(row, col, board, 'white');
    else if (piece === '♛') moves = queenMoves(row, col, board, 'black');
    else if (piece === '♔') moves = kingMoves(row, col, board, 'white');
    else if (piece === '♚') moves = kingMoves(row, col, board, 'black');
    
    // Apply superpower enhancements if active and it's the player's turn
    if (superpowerActive && color === 'white') {
        moves = applySuperpower(piece, row, col, moves, board, color);
    }
    
    // Filter out moves that would leave king in check (unless skipKingCheck is true)
    if (!skipKingCheck) {
        moves = moves.filter(move => !wouldLeaveKingInCheck(row, col, move.row, move.col, board, color));
    }
    return moves;
}

function applySuperpower(piece, row, col, baseMoves, board, color) {
    let enhancedMoves = [...baseMoves];
    
    switch (piece) {
        case '♙': // White Pawn - Can move like a knight once
            enhancedMoves.push(...knightMoves(row, col, board, color));
            break;
        case '♖': // White Rook - Can move diagonally like a bishop
            enhancedMoves.push(...bishopMoves(row, col, board, color));
            break;
        case '♘': // White Knight - Can move like a king (adjacent squares)
            enhancedMoves.push(...kingMoves(row, col, board, color));
            break;
        case '♗': // White Bishop - Can move like a rook
            enhancedMoves.push(...rookMoves(row, col, board, color));
            break;
        case '♕': // White Queen - Can teleport to any empty square within 3 squares
            for (let r = Math.max(0, row - 3); r <= Math.min(7, row + 3); r++) {
                for (let c = Math.max(0, col - 3); c <= Math.min(7, col + 3); c++) {
                    if (r !== row || c !== col) {
                        if (!board[r][c] || isOpponent(board[r][c], color)) {
                            enhancedMoves.push({ row: r, col: c });
                        }
                    }
                }
            }
            break;
        case '♔': // White King - Can move 2 squares in any direction
            for (let dr = -2; dr <= 2; dr++) {
                for (let dc = -2; dc <= 2; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = row + dr, nc = col + dc;
                    if (inBounds(nr, nc) && (!board[nr][nc] || isOpponent(board[nr][nc], color))) {
                        enhancedMoves.push({ row: nr, col: nc });
                    }
                }
            }
            break;
    }
    
    // Remove duplicates
    const uniqueMoves = [];
    const seen = new Set();
    for (const move of enhancedMoves) {
        const key = `${move.row},${move.col}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueMoves.push(move);
        }
    }
    
    return uniqueMoves;
}

function pawnMoves(row, col, board, color, moveHistory) {
    const dir = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    const moves = [];
    console.log('Calculating pawn moves for', color, 'pawn at', row, col);
    
    // Forward move
    if (inBounds(row + dir, col) && !board[row + dir][col]) {
        moves.push({ row: row + dir, col });
        // Double move from start
        if (row === startRow && !board[row + 2 * dir][col]) {
            moves.push({ row: row + 2 * dir, col });
        }
    }
    
    // Captures
    for (let dc of [-1, 1]) {
        const nr = row + dir, nc = col + dc;
        console.log('Checking capture at', nr, nc, 'piece there:', board[nr] ? board[nr][nc] : 'out of bounds');
        if (inBounds(nr, nc) && board[nr][nc] && isOpponent(board[nr][nc], color)) {
            console.log('Adding capture move to', nr, nc);
            moves.push({ row: nr, col: nc });
        }
    }
    
    console.log('Pawn moves generated:', moves);
    // TODO: En passant
    return moves;
}

function rookMoves(row, col, board, color) {
    return slideMoves(row, col, board, color, [[1,0], [-1,0], [0,1], [0,-1]]);
}
function bishopMoves(row, col, board, color) {
    return slideMoves(row, col, board, color, [[1,1], [1,-1], [-1,1], [-1,-1]]);
}
function queenMoves(row, col, board, color) {
    return slideMoves(row, col, board, color, [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]]);
}
function slideMoves(row, col, board, color, directions) {
    const moves = [];
    for (const [dr, dc] of directions) {
        let nr = row + dr, nc = col + dc;
        while (inBounds(nr, nc)) {
            if (!board[nr][nc]) {
                moves.push({ row: nr, col: nc });
            } else {
                if (isOpponent(board[nr][nc], color)) moves.push({ row: nr, col: nc });
                break;
            }
            nr += dr;
            nc += dc;
        }
    }
    return moves;
}
function knightMoves(row, col, board, color) {
    const moves = [];
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const nr = row + dr, nc = col + dc;
        if (inBounds(nr, nc) && (!board[nr][nc] || isOpponent(board[nr][nc], color))) {
            moves.push({ row: nr, col: nc });
        }
    }
    return moves;
}
function kingMoves(row, col, board, color) {
    const moves = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr, nc = col + dc;
            if (inBounds(nr, nc) && (!board[nr][nc] || isOpponent(board[nr][nc], color))) {
                moves.push({ row: nr, col: nc });
            }
        }
    }
    // TODO: Castling
    return moves;
}
function inBounds(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Check if move would leave king in check (basic)
function wouldLeaveKingInCheck(fromRow, fromCol, toRow, toCol, board, color) {
    const tempBoard = board.map(r => r.slice());
    const piece = tempBoard[fromRow][fromCol];
    tempBoard[toRow][toCol] = piece;
    tempBoard[fromRow][fromCol] = '';
    return isKingInCheck(tempBoard, color);
}

function isKingInCheck(board, color) {
    const king = color === 'white' ? '♔' : '♚';
    let kingPos = null;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        if (board[r][c] === king) kingPos = { row: r, col: c };
    }
    if (!kingPos) return true;
    const oppColor = color === 'white' ? 'black' : 'white';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        if (board[r][c] && isOpponent(board[r][c], color)) {
            const moves = getLegalMoves(r, c, board, oppColor, [], true);
            if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
                return true;
            }
        }
    }
    return false;
}

// Should be called at startup
function initChessBoard() {
    board = [
        ['♜','♞','♝','♛','♚','♝','♞','♜'],
        ['♟','♟','♟','♟','♟','♟','♟','♟'],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['♙','♙','♙','♙','♙','♙','♙','♙'],
        ['♖','♘','♗','♕','♔','♗','♘','♖']
    ];
    selected = null;
    superpowerCharge = 0;
    turn = 'white';
    moveHistory = [];
    updateSuperpowerChargeDisplay();
    renderChessBoard(board);
}

function toggleSuperpower() {
    if (!superpowerActive && superpowerCharge < chargeMax) {
        return; // Can't activate if charge isn't full
    }
    
    superpowerActive = !superpowerActive;
    
    if (superpowerActive) {
        // Activating superpower - don't consume charge yet
        chessBoard.classList.add('superpower');
        showSuperpowerMessage("Superpower activated! Make your move or deactivate to save the charge.");
    } else {
        // Deactivating superpower - keep the charge since no move was made
        chessBoard.classList.remove('superpower');
        showSuperpowerMessage("Superpower deactivated. Charge preserved.");
    }
    
    updateSuperpowerChargeDisplay();
}

function showSuperpowerMessage(message) {
    // Create a temporary message display
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        font-weight: bold;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

showMovesToggle.addEventListener('change', function() {
    showMoves = this.checked;
    renderChessBoard(board);
});
superpowerButton.addEventListener('click', toggleSuperpower);

const profileBtn = document.getElementById('profile-btn');
const profileDropdown = document.getElementById('profile-dropdown');
const profileDropdownInfo = document.getElementById('profile-dropdown-info');
const profileViewBtn = document.getElementById('profile-view-btn');
const profileLogoutBtn = document.getElementById('profile-logout-btn');
const profileLoginBtn = document.getElementById('profile-login-btn');

function updateProfileDropdown() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const profile = JSON.parse(localStorage.getItem('profile') || '{}');
    if (isLoggedIn) {
        profileDropdownInfo.innerHTML = `<b>${profile.username || 'User'}</b><br>Wins: ${profile.wins ?? 0} | Losses: ${profile.losses ?? 0}`;
        profileViewBtn.style.display = '';
        profileLogoutBtn.style.display = '';
        profileLoginBtn.style.display = 'none';
    } else {
        profileDropdownInfo.innerHTML = `<b>Not logged in</b>`;
        profileViewBtn.style.display = 'none';
        profileLogoutBtn.style.display = 'none';
        profileLoginBtn.style.display = '';
    }
}

profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    updateProfileDropdown();
    profileDropdown.style.display = profileDropdown.style.display === 'flex' ? 'none' : 'flex';
});
profileViewBtn.addEventListener('click', () => {
    window.location.href = 'profile.html';
});
profileLogoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('profile');
    profileDropdown.style.display = 'none';
    location.reload();
});
profileLoginBtn.addEventListener('click', () => {
    window.location.href = 'profile.html';
});

// Hide dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!profileDropdown.contains(e.target) && e.target !== profileBtn) {
        profileDropdown.style.display = 'none';
    }
});

// Example: After a win
function addWin() {
    let profile = JSON.parse(localStorage.getItem('profile') || '{}');
    profile.wins = (profile.wins || 0) + 1;
    localStorage.setItem('profile', JSON.stringify(profile));
}

// Example: After a loss
function addLoss() {
    let profile = JSON.parse(localStorage.getItem('profile') || '{}');
    profile.losses = (profile.losses || 0) + 1;
    localStorage.setItem('profile', JSON.stringify(profile));
}

initChessBoard();
updateSuperpowerChargeDisplay();
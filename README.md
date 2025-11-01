# English Shogi

A web-based implementation of Shogi (Japanese Chess) with English piece names and labels.

## How to Play

### Opening the Game
Open `index.html` in your web browser to start playing.

### Game Rules

**Objective**: Capture your opponent's King.

**Setup**: 
- Black pieces start at the bottom (rows 6-8)
- White pieces start at the top (rows 0-2)
- The board is 9x9 squares

**Piece Types** (English names):
- **K** - King (moves one square in any direction)
- **R** - Rook (moves horizontally or vertically any number of squares)
- **B** - Bishop (moves diagonally any number of squares)
- **G** - Gold General (moves like a king but cannot move diagonally backward)
- **S** - Silver General (moves diagonally or one square forward)
- **N** - Knight (jumps two squares forward then one square left or right)
- **L** - Lance (moves forward any number of squares)
- **P** - Pawn (moves one square forward)

**Promotion Zone**: 
- For Black: rows 0-2 (top three rows)
- For White: rows 6-8 (bottom three rows)

**Promotion Rules**:
- Pieces entering or starting in the promotion zone can be promoted
- Promoted pieces are marked with a "+" symbol
- Promoted pieces gain additional movement abilities
- Knights, Lances, and Pawns MUST promote when entering certain ranks

**Capturing and Dropping**:
- When you capture an opponent's piece, it goes to your captured pieces area
- You can drop captured pieces back onto the board (with restrictions)
- Pawns cannot be dropped in the promotion zone or on columns with friendly pawns
- Knights cannot be dropped in the last two ranks
- Lances cannot be dropped in the last rank

**Special Rules**:
- You cannot make a move that leaves your own king in check
- Checkmate occurs when a king is in check and cannot escape

### Controls

- **Click a piece** to select it and see valid moves (highlighted in green)
- **Click a highlighted square** to move your piece there
- **Click a captured piece** to select it for dropping, then click an empty square
- **Reset Game** button starts a new game
- **Undo Move** button undoes the last move

Enjoy playing English Shogi!


const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

// Render the chessboard
const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";  

  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + colIndex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = colIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );

        pieceElement.innerText = getPieceUnicode(square.type, square.color);
        pieceElement.draggable = playerRole === square.color;

        // Drag start event
        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: colIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        // Drag end event
        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      // Allow drop on square
      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
        squareElement.classList.add("dragover");
      });

      squareElement.addEventListener("dragleave", () => {
        squareElement.classList.remove("dragover");
      });

      // Handle piece drop
      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        squareElement.classList.remove("dragover");

        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row, 10),
            col: parseInt(squareElement.dataset.col, 10),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });
};

// Handle moves
const handleMove = (source, target) => {
  const move = chess.move({
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q", // Default promotion to queen
  });

  if (move) {
    renderBoard();
    socket.emit("move", move);  
  } else {
    alert("Invalid move!");
  }
};

// Get the Unicode representation of a chess piece
const getPieceUnicode = (type, color) => {
  const unicodePieces = {
    p: "\u2659",
    r: "\u2656",
    n: "\u2658",
    b: "\u2657",
    q: "\u2655",
    k: "\u2654",
  };
  return color === "w"
    ? unicodePieces[type]
    : unicodePieces[type].toLowerCase();
};

// Listen for role assignment from the server
socket.on("playerRole", (role) => {
  playerRole = role;
  renderBoard();
});

// Listen for moves from the server
socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});

// Initial render
renderBoard();

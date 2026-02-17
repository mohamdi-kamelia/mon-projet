const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");
const statusElement = document.querySelector(".status");
const userCountElement = document.querySelector(".user-count");
const turnPopupElement = document.querySelector(".turn-popup");
const messageElement = document.querySelector(".message");
const usernameInput = document.querySelector("#username");
const roomNameInput = document.querySelector("#roomName");
const createRoomButton = document.querySelector("#createRoomButton");
const joinRoomButton = document.querySelector("#joinRoomButton");
const usersList = document.querySelector("#usersList");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatMessages = document.querySelector(".chat-messages");
const resetButton = document.querySelector("#resetButton");

let gameFinished = false;

// Select the container holding the login inputs to hide it later
const loginContainer = usernameInput.parentElement; 

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let currentRoom = null;
let username = null;
let isAutoJoining = false; // Flag to track if we are in auto-join mode

// --- NEW AUTO-JOIN LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const urlRoom = params.get("roomID");
  const urlPlayer = params.get("playerName");

  if (urlRoom && urlPlayer) {
    // 1. Set global variables
    currentRoom = urlRoom;
    username = urlPlayer;
    isAutoJoining = true;

    // 2. Hide the login form (Cleaner UI for iframe)
    if (loginContainer) {
      loginContainer.style.display = "none";
    }

    // 3. Attempt to JOIN first
    console.log(`Auto-joining Room: ${currentRoom} as ${username}`);
    socket.emit("joinRoom", { roomName: currentRoom, username: username });
  }
});
// ---------------------------

createRoomButton.addEventListener("click", () => {
  const roomName = roomNameInput.value.trim();
  username = usernameInput.value.trim();
  if (roomName && username) {
    socket.emit("createRoom", { roomName, username });
    currentRoom = roomName;
  }
});

joinRoomButton.addEventListener("click", () => {
  const roomName = roomNameInput.value.trim();
  username = usernameInput.value.trim();
  if (roomName && username) {
    socket.emit("joinRoom", { roomName, username });
    currentRoom = roomName;
  }
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (message) {
    socket.emit("sendMessage", { message, username, roomName: currentRoom });
    chatInput.value = "";
  }
});

resetButton.addEventListener("click", () => {
  if (currentRoom && playerRole) {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser la partie ?")) {
      socket.emit("resetGame", currentRoom);
    }
  }
});

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "\u2659",
    r: "\u2656",
    n: "\u2658",
    b: "\u2657",
    q: "\u2655",
    k: "\u2654",
  };
  return unicodePieces[piece.type];
};

const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q",
  };
  socket.emit("move", move, currentRoom);
};

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";
  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = true;

        pieceElement.addEventListener("dragstart", (e) => {
          if (
            (square.color === "w" &&
              playerRole === "w" &&
              chess.turn() === "w") ||
            (square.color === "b" && playerRole === "b" && chess.turn() === "b")
          ) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            showPossibleMoves(rowIndex, squareIndex);
          }
          e.dataTransfer.setData("text/plain", "");
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
          const squares = document.querySelectorAll(".square");
          squares.forEach((square) => square.classList.remove("possible-move"));
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  // Reset UI fin de partie si on repart sur une partie normale
  if (!chess.in_checkmate() && !chess.in_draw() && gameFinished) {
    clearEndGameUI();
  }

  if (chess.in_checkmate()) {
    statusElement.textContent = "Échec et mat";

    // turn() = camp qui doit jouer MAIS il est mat => perdant
    const loser = chess.turn(); // 'w' ou 'b'
    const winner = loser === "w" ? "b" : "w";
    showEndGame({ type: "checkmate", winnerColor: winner });
  } else if (chess.in_draw()) {
    statusElement.textContent = "Nulle";
    showEndGame({ type: "draw" });
  } else if (chess.in_stalemate()) {
    statusElement.textContent = "Pat";
    showEndGame({ type: "draw" });
  } else if (chess.in_threefold_repetition()) {
    statusElement.textContent = "Triple répétition";
    showEndGame({ type: "draw" });
  } else if (chess.insufficient_material()) {
    statusElement.textContent = "Matériel insuffisant";
    showEndGame({ type: "draw" });
  } else if (chess.in_check()) {
    statusElement.textContent = "Échec";
  } else {
    statusElement.textContent = "";
  }

  if (!gameFinished) {
    turnPopupElement.textContent = `Au tour des ${chess.turn() === "w" ? "Blancs" : "Noirs"} `;
    turnPopupElement.classList.add("visible");
    statusElement.textContent = `Au tour des ${chess.turn() === "w" ? "Blancs" : "Noirs"}`;
    setTimeout(() => turnPopupElement.classList.remove("visible"), 2000);
  } else {
    turnPopupElement.classList.remove("visible");
  }


  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

socket.on("PlayerRole", (role) => {
  playerRole = role;
  renderBoard();
});

socket.on("spectator", () => {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});

socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});

socket.on("userCount", (count) => {
  userCountElement.textContent = `Utilisateurs connectés: ${count}`;
});

socket.on("updateUsers", (users) => {
  usersList.innerHTML = "";
  users.forEach((user) => {
    const userElement = document.createElement("li");
    userElement.textContent = `${user.username} (${user.role})`;
    usersList.appendChild(userElement);
  });
});

// --- UPDATED ERROR HANDLING ---
socket.on("error", (message) => {
  // If we are auto-joining and the room doesn't exist, Create it automatically!
  if (isAutoJoining && message === "Room does not exist") {
    console.log("Room not found. Creating new room automatically...");
    socket.emit("createRoom", { roomName: currentRoom, username: username });
    return; // Don't show the error message to the user
  }

  // Standard error display
  messageElement.textContent = message;
  setTimeout(() => (messageElement.textContent = ""), 3000);
});
// -----------------------------

socket.on("opponentJoined", () => {
  messageElement.textContent = "Un adversaire a rejoint la partie. Que le meilleur gagne !";
  setTimeout(() => (messageElement.textContent = ""), 3000);
});

socket.on("spectatorAvailable", () => {
  if (confirm("A pair is available. Do you want to join the game?")) {
    socket.emit("spectatorResponse", true, currentRoom);
  } else {
    socket.emit("spectatorResponse", false, currentRoom);
  }
});

socket.on("chatMessage", ({ message, username }) => {
  const chatMsgElement = document.createElement("div");
  chatMsgElement.classList.add("message");
  chatMsgElement.innerHTML = `<strong>${username}:</strong> ${message}`;
  chatMessages.appendChild(chatMsgElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("gameReset", () => {
  clearEndGameUI();
  chess.reset();
  renderBoard();
  messageElement.textContent = "La partie a été réinitialisée";
  setTimeout(() => (messageElement.textContent = ""), 3000);
});

const showPossibleMoves = (row, col) => {
  const moves = chess.moves({
    square: `${String.fromCharCode(97 + col)}${8 - row}`,
    verbose: true,
  });
  const squares = document.querySelectorAll(".square");
  squares.forEach((square) => {
    square.classList.remove("possible-move");
  });
  moves.forEach((move) => {
    const targetSquare = document.querySelector(
      `.square[data-row="${8 - move.to[1]}"][data-col="${
        move.to.charCodeAt(0) - 97
      }"]`
    );
    targetSquare.classList.add("possible-move");
  });
};


const showEndGame = ({ type, winnerColor = null }) => {
  gameFinished = true;

  // Afficher le bouton reset à la fin
  resetButton.classList.remove("hidden");
  resetButton.classList.add("animate-bounce"); // petite anim Tailwind

  // Message + effet "victoire"
  if (type === "checkmate") {
    const winnerText = winnerColor === "w" ? "Blancs" : "Noirs";
    messageElement.textContent = `Fin de partie — Victoire des ${winnerText} !`;
    messageElement.classList.remove("draw");
    messageElement.classList.add("win");
  } else {
    messageElement.textContent = "Fin de partie — Match nul.";
    messageElement.classList.remove("win");
    messageElement.classList.add("draw");
  }

  // (Optionnel) figer l'UI côté client : plus de drag
  const pieces = document.querySelectorAll(".piece");
  pieces.forEach((p) => (p.draggable = false));
};

const clearEndGameUI = () => {
  gameFinished = false;
  messageElement.textContent = "";
  messageElement.classList.remove("win", "draw");
  resetButton.classList.remove("animate-bounce");
  // si tu veux cacher le reset tant que la partie continue :
  resetButton.classList.add("hidden");
};


renderBoard();
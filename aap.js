import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import http from "http";
import { Chess } from "chess.js";
import path from "path";
import { fileURLToPath } from "url";

// Configure dotenv
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;


const server = http.createServer(app);
const io = new Server(server);

// Chess game logic
const chess = new Chess();
let players = { white: null, black: null }; 

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

connectDB(DATABASE_URL);


app.get("/", (req, res) => {
  res.render("index");
});


server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Socket.io logic
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Assign roles to players
  if (!players.white) {
    players.white = socket.id;
    socket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit("playerRole", "b");
  } else {
    socket.emit("playerRole", "spectator");
  }

  // Handle player moves
  socket.on("move", (move) => {
    try {
      // Validate turn
      if (chess.turn() === "w" && socket.id !== players.white) return;
      if (chess.turn() === "b" && socket.id !== players.black) return;

      const result = chess.move(move); 
      if (result) {
        io.emit("move", move); 
        io.emit("boardState", chess.fen());  
      } else {
        console.log("Invalid move:", move);
        socket.emit("invalidMove", move);  
      }
    } catch (err) {
      console.error(err);
      socket.emit("error", err.message);
    }
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    if (socket.id === players.white) {
      players.white = null;
    } else if (socket.id === players.black) {
      players.black = null;
    }
  });
});

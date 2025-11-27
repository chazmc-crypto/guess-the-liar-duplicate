import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, get } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfHKSTDRQVsoFXSbospWZHJRlRSijgiW0",
  authDomain: "guesstheliar-ca0b6.firebaseapp.com",
  databaseURL: "https://guesstheliar-ca0b6-default-rtdb.firebaseio.com",
  projectId: "guesstheliar-ca0b6",
  storageBucket: "guesstheliar-ca0b6.firebasestorage.app",
  messagingSenderId: "300436562056",
  appId: "1:300436562056:web:8e5368b914a5cbfded7f3d"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Example prompt categories (simplified for brevity)
const promptCategories = [
  { name: "Movies", regular: ["Favorite movie?"], impostor: ["Worst movie?"] },
  { name: "Food", regular: ["Favorite food?"], impostor: ["Grossest food?"] },
  { name: "Hobbies", regular: ["Favorite hobby?"], impostor: ["Boring hobby?"] },
];

export default function App() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState({});
  const [impostors, setImpostors] = useState([]);
  const [phase, setPhase] = useState("lobby");
  const [timerEnd, setTimerEnd] = useState(null);
  const [creator, setCreator] = useState("");

  // Listen to room updates
  useEffect(() => {
    if (!roomCode) return;
    const roomRef = ref(database, `rooms/${roomCode}`);
    const unsub = onValue(roomRef, snapshot => {
      const data = snapshot.val();
      if (!data) return;
      setPlayers(data.players || {});
      setImpostors(data.impostors || []);
      setPhase(data.phase || "lobby");
      setTimerEnd(data.timerEnd || null);
      setCreator(data.creator || "");
    });
    return () => unsub();
  }, [roomCode]);

  // Timer for phases
  useEffect(() => {
    if (!timerEnd || phase === "lobby" || phase === "reveal") return;
    const interval = setInterval(async () => {
      if (Date.now() >= timerEnd) {
        const roomRef = ref(database, `rooms/${roomCode}`);
        const snap = await get(roomRef);
        if (!snap.exists()) return;
        if (phase === "answer") {
          await update(roomRef, { phase: "debate", timerEnd: Date.now() + 3 * 60 * 1000 });
        } else if (phase === "debate") {
          await update(roomRef, { phase: "reveal", timerEnd: null });
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerEnd, phase, roomCode]);

  // Create a room
  const createRoom = async () => {
    if (!name) return alert("Enter your name first!");
    const code = Math.floor(Math.random() * 10000).toString();
    setRoomCode(code);
    const playerData = {};
    playerData[name] = { question: "", vote: "" };
    await set(ref(database, `rooms/${code}`), { players: playerData, impostors: [], phase: "lobby", creator: name });
  };

  // Join an existing room
  const joinRoom = async () => {
    if (!roomCode || !name) return alert("Enter both name and room code!");
    const roomRef = ref(database, `rooms/${roomCode}`);
    const roomSnap = await get(roomRef);
    if (!roomSnap.exists()) {
      return alert("Room does not exist!");
    }
    const playerRef = ref(database, `rooms/${roomCode}/players/${name}`);
    await update(playerRef, { question: "", vote: "" });
  };

  // Start the game (creator only)
  const startGame = async () => {
    if (name !== creator) return;
    await startRound();
  };

  // Start a round
  const startRound = async () => {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snap = await get(roomRef);
    if (!snap.exists()) return;
    const data = snap.val();
    const playerNames = Object.keys(data.players);
    const numImpostors = Math.floor(Math.random() * playerNames.length) || 1;
    const shuffled = [...playerNames].sort(() => 0.5 - Math.random());
    const selectedImpostors = shuffled.slice(0, numImpostors);
    const category = promptCategories[Math.floor(Math.random() * promptCategories.length)];
    const updatedPlayers = {};
    playerNames.forEach(p => {
      if (selectedImpostors.includes(p)) {
        updatedPlayers[p] = { vote: "", question: category.impostor[Math.floor(Math.random() * category.impostor.length)] };
      } else {
        updatedPlayers[p] = { vote: "", question: category.regular[Math.floor(Math.random() * category.regular.length)] };
      }
    });
    const end = Date.now() + 60 * 1000;
    await update(roomRef, { players: updatedPlayers, impostors: selectedImpostors, phase: "answer", timerEnd: end });
  };

  const vote = async votedPlayer => {
    const voteRef = ref(database, `rooms/${roomCode}/players/${name}/vote`);
    await set(voteRef, votedPlayer);
  };

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      {/* Lobby */}
      {phase === "lobby" && (
        <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "10px", maxWidth: "400px", margin: "20px auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          <h2 style={{ textAlign: "center" }}>Lobby</h2>
          <input 
            placeholder="Your name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }} 
          />
          <input 
            placeholder="Room code" 
            value={roomCode} 
            onChange={e => setRoomCode(e.target.value)} 
            style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }} 
          />
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button onClick={createRoom} style={{ padding: "10px", borderRadius: "5px", cursor: "pointer" }}>Create Room</button>
            <button onClick={joinRoom} style={{ padding: "10px", borderRadius: "5px", cursor: "pointer" }}>Join Room</button>
          </div>
          {name && creator && name === creator && (
            <button onClick={startGame} style={{ padding: "10px", borderRadius: "5px", cursor: "pointer", backgroundColor: "#4caf50", color: "#fff", border: "none" }}>Start Game</button>
          )}
        </div>
      )}

      {/* Answer Phase */}
      {phase === "answer" && (
        <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
          <h2>Answer Phase</h2>
          <p><strong>Your question:</strong> {players[name]?.question}</p>
          <p><strong>Time left:</strong> {Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000))} seconds</p>
          <p>Discuss your answer in real life. The impostor won't know they're impostor yet.</p>
        </div>
      )}

      {/* Debate Phase */}
      {phase === "debate" && (
        <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
          <h2>Debate Phase</h2>
          <p>Discuss in real life and then vote in the app.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {Object.keys(players).map(p => (
              <button key={p} onClick={() => vote(p)} disabled={players[name]?.vote === p} style={{ padding: "10px", borderRadius: "5px", cursor: "pointer" }}>
                Vote {p}
              </button>
            ))}
          </div>
          <p>Your vote: {players[name]?.vote || "None"}</p>
        </div>
      )}

      {/* Reveal Phase */}
      {phase === "reveal" && (
        <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
          <h2>Reveal Phase</h2>
          <p><strong>Impostor(s):</strong> {impostors.join(", ") || "None"}</p>
          <h4>Votes:</h4>
          <ul>
            {Object.entries(players).map(([p, data]) => (
              <li key={p}>{p} voted for {data.vote || "nobody"}</li>
            ))}
          </ul>
          {name === creator && <button onClick={startRound} style={{ padding: "10px", borderRadius: "5px", cursor: "pointer", marginTop: "10px" }}>Next Round</button>}
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { database } from "./firebase";
import { ref, set, push, get } from "firebase/database";

function App() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [error, setError] = useState("");

  // Generate a random 6-digit room code
  const generateRoomCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const createRoom = async () => {
    if (!name) {
      setError("Please enter your name");
      return;
    }

    const code = generateRoomCode();
    const roomRef = ref(database, `rooms/${code}`);
    
    // Randomly pick impostor index
    const players = [{ name, isImpostor: false }];
    const impostorIndex = Math.random() < 0.5 ? 0 : -1; // 50% chance of impostor
    if (impostorIndex === 0) players[0].isImpostor = true;

    await set(roomRef, { players });
    setRoomCode(code);
    setCurrentRoom(players);
    setError("");
  };

  const joinRoom = async () => {
    if (!name || !roomCode) {
      setError("Please enter your name and room code");
      return;
    }

    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      setError("Room not found");
      return;
    }

    const roomData = snapshot.val();
    const players = roomData.players || [];

    // Randomly assign impostor if none yet
    if (!players.some(p => p.isImpostor)) {
      const impostorIndex = Math.floor(Math.random() * (players.length + 1));
      if (impostorIndex === players.length) {
        // Current player becomes impostor
        players.push({ name, isImpostor: true });
      } else {
        players.push({ name, isImpostor: false });
        players[impostorIndex].isImpostor = true;
      }
    } else {
      players.push({ name, isImpostor: false });
    }

    await set(roomRef, { players });
    setCurrentRoom(players);
    setError("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Guess The Liar</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div style={{ marginTop: 10 }}>
        <button onClick={createRoom}>Create Room</button>
      </div>
      <input
        placeholder="Enter room code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
        style={{ marginTop: 10 }}
      />
      <div style={{ marginTop: 10 }}>
        <button onClick={joinRoom}>Join Room</button>
      </div>

      {currentRoom && (
        <div style={{ marginTop: 20 }}>
          <h2>Room Code: {roomCode}</h2>
          <ul>
            {currentRoom.map((player, index) => (
              <li key={index}>
                {player.name} {player.isImpostor ? "(Impostor)" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;

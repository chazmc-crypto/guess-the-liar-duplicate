import React, { useState, useEffect } from "react";
import { database } from "./firebase.js";
import { ref, set, get, update, onValue, child } from "firebase/database";

// Example prompts
const regularPrompts = [
  "What is the correct amount of money to spend on a first date?",
  "What is the ideal bedtime for a 10-year-old?",
  "What is the best ice cream flavor?"
];

const impostorPrompts = [
  "Pick a dollar range between $20-$500",
  "Pick a bedtime between 1 AM and 6 AM",
  "Choose a random flavor of ice cream that doesn't exist"
];

export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState({});
  const [prompt, setPrompt] = useState("");
  const [isImpostor, setIsImpostor] = useState(false);
  const [joined, setJoined] = useState(false);

  // Listen for updates in the room
  useEffect(() => {
    if (!roomCode) return;

    const roomRef = ref(database, `rooms/${roomCode}`);
    const unsub = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      setPlayers(data.players || {});
      setPrompt(data.prompt || "");

      if (playerName && data.players && data.players[playerName]) {
        setIsImpostor(data.players[playerName].isImpostor);
      }
    });

    return () => unsub();
  }, [roomCode, playerName]);

  // Create a new room
  const handleCreateRoom = async () => {
    if (!playerName) return alert("Enter your name first!");
    const newRoomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const randomPrompt =
      regularPrompts[Math.floor(Math.random() * regularPrompts.length)];
    const randomImpostorPrompt =
      impostorPrompts[Math.floor(Math.random() * impostorPrompts.length)];

    await set(ref(database, `rooms/${newRoomCode}`), {
      players: {
        [playerName]: { isImpostor: false }
      },
      prompt: randomPrompt,
      impostorPrompt: randomImpostorPrompt,
      roundActive: true
    });

    // Assign a random impostor
    assignImpostor(newRoomCode);

    setRoomCode(newRoomCode);
    setJoined(true);
  };

  // Join an existing room
  const handleJoinRoom = async () => {
    if (!playerName || !roomCode) return alert("Enter name and room code!");
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(child(roomRef, "players"));

    if (!snapshot.exists()) return alert("Room does not exist!");

    await update(ref(database, `rooms/${roomCode}/players`), {
      [playerName]: { isImpostor: false }
    });

    setJoined(true);
  };

  // Randomly assign one impostor in the room
  const assignImpostor = async (room) => {
    const playersRef = ref(database, `rooms/${room}/players`);
    const snapshot = await get(playersRef);
    if (!snapshot.exists()) return;

    const names = Object.keys(snapshot.val());
    const impostorName = names[Math.floor(Math.random() * names.length)];

    names.forEach((name) => {
      update(ref(database, `rooms/${room}/players/${name}`), {
        isImpostor: name === impostorName
      });
    });
  };

  // Determine which prompt to show
  const displayedPrompt = isImpostor ? "You are the impostor!" : prompt;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Guess The Liar</h1>

      {!joined && (
        <>
          <div>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>

          <div style={{ marginTop: "20px" }}>
            <button onClick={handleCreateRoom}>Create Room</button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <input
              type="text"
              placeholder="Enter room code to join"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
            />
            <button onClick={handleJoinRoom} style={{ marginLeft: "10px" }}>
              Join Room
            </button>
          </div>
        </>
      )}

      {joined && (
        <>
          <h2>Room: {roomCode}</h2>
          <h3>Hello, {playerName}!</h3>
          <p>{displayedPrompt}</p>

          <h4>Players in room:</h4>
          <ul>
            {Object.keys(players).map((name) => (
              <li key={name}>
                {name} {players[name].isImpostor ? "(Impostor)" : ""}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

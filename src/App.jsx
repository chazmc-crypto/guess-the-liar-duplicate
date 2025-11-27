import React, { useState, useEffect } from "react";
import { database } from "./firebase";
import { ref, set, get, update, onValue } from "firebase/database";

const prompts = [
  "What is the correct amount of money to spend on a first date?",
  "Pick a dollar range between $20-500",
  "What is the best pizza topping?",
  "Pick a weird pizza topping"
];

function App() {
  const [name, setName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState({});
  const [phase, setPhase] = useState("waiting");
  const [timeLeft, setTimeLeft] = useState(0);
  const [voteTarget, setVoteTarget] = useState("");
  const [impostors, setImpostors] = useState([]);
  const [error, setError] = useState("");
  const [creator, setCreator] = useState("");

  const generateRoomCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const createRoom = async () => {
    if (!name) { setError("Enter your name"); return; }
    const code = generateRoomCode();
    const roomRef = ref(database, `rooms/${code}`);
    await set(roomRef, {
      creator: name,
      players: { [name]: { vote: "", question: "" } },
      phase: "waiting",
      timerEnd: 0,
      impostors: []
    });
    setRoomCode(code);
    setCreator(name);
    setPhase("waiting");
    setError("");
  };

  const joinRoom = async () => {
    if (!name || !roomCodeInput) { setError("Enter name and room code"); return; }
    const roomRef = ref(database, `rooms/${roomCodeInput}`);
    const snap = await get(roomRef);
    if (!snap.exists()) { setError("Room not found"); return; }
    const roomData = snap.val();
    const updatedPlayers = { ...roomData.players, [name]: { vote: "", question: "" } };
    await update(roomRef, { players: updatedPlayers });
    setRoomCode(roomCodeInput);
    setCreator(roomData.creator);
    setPhase(roomData.phase);
    setError("");
  };

  const startGame = async () => {
    if (name !== creator) return;
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snap = await get(roomRef);
    if (!snap.exists()) return;
    const roomData = snap.val();
    const playerNames = Object.keys(roomData.players);
    const numImpostors = Math.floor(Math.random() * playerNames.length);
    const shuffled = [...playerNames].sort(() => 0.5 - Math.random());
    const selectedImpostors = shuffled.slice(0, numImpostors);

    const updatedPlayers = {};
    playerNames.forEach((p) => {
      const question = prompts[Math.floor(Math.random() * prompts.length)];
      updatedPlayers[p] = { vote: "", question };
    });

    const timerEnd = Date.now() + 60 * 1000; // 1 min answer
    await update(roomRef, {
      players: updatedPlayers,
      impostors: selectedImpostors,
      phase: "answer",
      timerEnd
    });
  };

  // --- Sync room data ---
  useEffect(() => {
    if (!roomCode) return;
    const roomRef = ref(database, `rooms/${roomCode}`);
    const unsubscribe = onValue(roomRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.val();
      setPlayers(data.players || {});
      setPhase(data.phase || "waiting");
      setCreator(data.creator || "");
      if (data.timerEnd) setTimeLeft(Math.max(Math.floor((data.timerEnd - Date.now()) / 1000), 0));
      setImpostors(data.phase === "reveal" ? data.impostors || [] : []);
    });
    return () => unsubscribe();
  }, [roomCode]);

  // --- Timer ---
  useEffect(() => {
    if (!roomCode || !phase) return;
    const roomRef = ref(database, `rooms/${roomCode}`);
    let interval;
    if (phase === "answer" || phase === "debate") {
      interval = setInterval(async () => {
        const snap = await get(roomRef);
        if (!snap.exists()) return;
        const remaining = Math.max(Math.floor((snap.val().timerEnd - Date.now()) / 1000), 0);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          if (phase === "answer") {
            const newEnd = Date.now() + 3 * 60 * 1000; // 3 min debate
            update(roomRef, { phase: "debate", timerEnd: newEnd });
          } else if (phase === "debate") {
            update(roomRef, { phase: "voting", timerEnd: 0 });
          }
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [phase, roomCode]);

  const castVote = async () => {
    if (!voteTarget) return;
    const playerRef = ref(database, `rooms/${roomCode}/players/${name}`);
    await update(playerRef, { vote: voteTarget });

    const roomSnap = await get(ref(database, `rooms/${roomCode}/players`));
    const allVoted = Object.values(roomSnap.val()).every(p => p.vote);
    if (allVoted) {
      await update(ref(database, `rooms/${roomCode}`), { phase: "reveal" });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Guess The Liar</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!roomCode && (
        <div>
          <input placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Enter room code to join" value={roomCodeInput} onChange={e => setRoomCodeInput(e.target.value)} />
          <div style={{ marginTop: 10 }}>
            <button onClick={createRoom}>Create Room</button>
            <button onClick={joinRoom}>Join Room</button>
          </div>
        </div>
      )}

      {roomCode && phase === "waiting" && (
        <div>
          <h2>Room Code: {roomCode}</h2>
          {name === creator && <button onClick={startGame}>Start Game</button>}
          <ul>{Object.keys(players).map(p => <li key={p}>{p}</li>)}</ul>
        </div>
      )}

      {(phase === "answer" || phase === "debate") && (
        <div>
          <h2>Phase: {phase}</h2>
          <h3>Time left: {timeLeft} seconds</h3>
          <h4>Your Question:</h4>
          <p>{players[name]?.question}</p>
          <ul>{Object.keys(players).map(p => <li key={p}>{p}</li>)}</ul>
        </div>
      )}

      {phase === "voting" && (
        <div>
          <h2>Voting Phase</h2>
          <select value={voteTarget} onChange={e => setVoteTarget(e.target.value)}>
            <option value="">Select a player</option>
            {Object.keys(players).filter(p => p !== name).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={castVote}>Submit Vote</button>
        </div>
      )}

      {phase === "reveal" && (
        <div>
          <h2>Reveal Phase</h2>
          <p>Impostor(s): {impostors.join(", ") || "None"}</p>
          <h4>Votes:</h4>
          <ul>
            {Object.entries(players).map(([p, data]) => <li key={p}>{p} voted for {data.vote || "nobody"}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;

import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, get } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
apiKey: "AIzaSyBfHKSTDRQVsoFXSbospWZHJRlRSijgiW0",
authDomain: "guesstheliar-ca0b6.firebaseapp.com",
databaseURL: "[https://guesstheliar-ca0b6-default-rtdb.firebaseio.com](https://guesstheliar-ca0b6-default-rtdb.firebaseio.com)",
projectId: "guesstheliar-ca0b6",
storageBucket: "guesstheliar-ca0b6.firebasestorage.app",
messagingSenderId: "300436562056",
appId: "1:300436562056:web:8e5368b914a5cbfded7f3d"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Example prompt categories
const promptCategories = [
{
name: "Date Spending",
regular: ["What is the ideal first date spending?", "Choose a budget for a first date meal"],
impostor: ["Pick a random dollar amount", "Choose an unusual date budget"]
},
{
name: "Pizza Toppings",
regular: ["Choose a classic pizza topping", "Pick a topping most people like"],
impostor: ["Pick a weird topping", "Choose an unexpected pizza topping"]
}
// add more categories here
];

export default function App() {
const [name, setName] = useState("");
const [roomCode, setRoomCode] = useState("");
const [players, setPlayers] = useState({});
const [impostors, setImpostors] = useState([]);
const [phase, setPhase] = useState("lobby");
const [timerEnd, setTimerEnd] = useState(null);
const [creator, setCreator] = useState("");

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

const createRoom = async () => {
const code = Math.floor(Math.random() * 10000).toString();
setRoomCode(code);
const playerData = {};
playerData[name] = { question: "", vote: "" };
await set(ref(database, `rooms/${code}`), {
players: playerData,
impostors: [],
phase: "lobby",
creator: name
});
};

const joinRoom = async () => {
if (!roomCode || !name) return;
const playerRef = ref(database, `rooms/${roomCode}/players/${name}`);
await set(playerRef, { question: "", vote: "" });
};

const startGame = async () => {
if (name !== creator) return;
const roomRef = ref(database, `rooms/${roomCode}`);
const snap = await get(roomRef);
if (!snap.exists()) return;
const data = snap.val();
const playerNames = Object.keys(data.players);
const numImpostors = Math.floor(Math.random() * playerNames.length);
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
const timerEnd = Date.now() + 60 * 1000;
await update(roomRef, { players: updatedPlayers, impostors: selectedImpostors, phase: "answer", timerEnd });
};

const startNextRound = async () => {
const roomRef = ref(database, `rooms/${roomCode}`);
const snap = await get(roomRef);
if (!snap.exists()) return;
const data = snap.val();
const playerNames = Object.keys(data.players);
const numImpostors = Math.floor(Math.random() * playerNames.length);
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
const timerEnd = Date.now() + 60 * 1000;
await update(roomRef, { players: updatedPlayers, impostors: selectedImpostors, phase: "answer", timerEnd });
};

const vote = async votedPlayer => {
const voteRef = ref(database, `rooms/${roomCode}/players/${name}/vote`);
await set(voteRef, votedPlayer);
};

return (
<div style={{ padding: "20px" }}>
{phase === "lobby" && ( <div> <h2>Lobby</h2>
<input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
<input placeholder="Room code" value={roomCode} onChange={e => setRoomCode(e.target.value)} /> <button onClick={createRoom}>Create Room</button> <button onClick={joinRoom}>Join Room</button>
{name === creator && <button onClick={startGame}>Start Game</button>} </div>
)}

```
  {phase === "answer" && (  
    <div>  
      <h2>Answer Phase</h2>  
      <p>Your question: {players[name]?.question}</p>  
      <p>Time left: {Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000))} seconds</p>  
    </div>  
  )}  

  {phase === "debate" && (  
    <div>  
      <h2>Debate Phase</h2>  
      <p>Discuss in real life! Then vote in the app.</p>  
      {Object.keys(players).map(p => (  
        <button key={p} onClick={() => vote(p)} disabled={players[name]?.vote === p}>  
          Vote {p}  
        </button>  
      ))}  
      <p>Your vote: {players[name]?.vote || "None"}</p>  
    </div>  
  )}  

  {phase === "reveal" && (  
    <div>  
      <h2>Reveal Phase</h2>  
      <p>Impostor(s): {impostors.join(", ") || "None"}</p>  
      <h4>Votes:</h4>  
      <ul>  
        {Object.entries(players).map(([p, data]) => (  
          <li key={p}>{p} voted for {data.vote || "nobody"}</li>  
        ))}  
      </ul>  
      {name === creator && <button onClick={startNextRound}>Next Round</button>}  
    </div>  
  )}  
</div>  
```

);
}

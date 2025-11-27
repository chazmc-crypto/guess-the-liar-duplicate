// App.jsx
import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, get } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

// ---------------- FIREBASE CONFIG ----------------
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

// ---------------- CATEGORY DATA ----------------
const promptCategories = [
{ name: "Movies", real: "What's your favorite movie?", impostors: ["Worst movie ever?", "Pick a movie nobody should watch.", "A movie with zero stars?"] },
{ name: "Food", real: "What's your go-to comfort food?", impostors: ["Grossest food you can imagine?", "Food you'd refuse ever?", "Worst tasting dish?"] },
{ name: "Music", real: "Which song or artist do you listen to most?", impostors: ["Worst song ever?", "Pick a genre that ruins music.", "Track that makes people cringe?"] }
];

// ---------------- APP COMPONENT ----------------
export default function App() {
const [name, setName] = useState("");
const [roomCode, setRoomCode] = useState("");
const [players, setPlayers] = useState({});
const [impostors, setImpostors] = useState([]);
const [phase, setPhase] = useState("lobby"); // lobby | answer | debate | reveal
const [timerEnd, setTimerEnd] = useState(null);
const [creator, setCreator] = useState("");
const [timeLeft, setTimeLeft] = useState(0);
const [realQuestion, setRealQuestion] = useState("");

// ---------------- SUBSCRIBE TO ROOM ----------------
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
setRealQuestion(data.realQuestion || "");
});
return () => unsub();
}, [roomCode]);

// ---------------- TIMER COUNTDOWN ----------------
useEffect(() => {
if (!timerEnd || phase === "lobby" || phase === "reveal") return;
const tick = setInterval(async () => {
const remain = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
setTimeLeft(remain);

```
  if (remain <= 0) {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snap = await get(roomRef);
    if (!snap.exists()) return;

    if (phase === "answer") await update(roomRef, { phase: "debate", timerEnd: Date.now() + 3 * 60 * 1000 });
    else if (phase === "debate") await update(roomRef, { phase: "reveal", timerEnd: null });
  }
}, 1000);
return () => clearInterval(tick);
```

}, [timerEnd, phase, roomCode]);

// ---------------- ROOM MANAGEMENT ----------------
const createRoom = async () => {
if (!name) return alert("Enter a display name first.");
const code = Math.floor(Math.random() * 9000 + 1000).toString();
setRoomCode(code);
const playerObj = { [name]: { question: "", vote: "" } };
await set(ref(database, `rooms/${code}`), { players: playerObj, impostors: [], phase: "lobby", timerEnd: null, creator: name, realQuestion: "" });
};

const joinRoom = async () => {
if (!roomCode || !name) return alert("Enter room code and name.");
const roomRef = ref(database, `rooms/${roomCode}`);
const snap = await get(roomRef);
if (!snap.exists()) return alert("Room not found.");
await set(ref(database, `rooms/${roomCode}/players/${name}`), { question: "", vote: "" });
};

const startRound = async () => {
if (!roomCode) return;
const roomRef = ref(database, `rooms/${roomCode}`);
const snap = await get(roomRef);
if (!snap.exists()) return;
const data = snap.val();
const playerNames = Object.keys(data.players || {});
if (!playerNames.length) return;

```
const numImpostors = Math.floor(Math.random() * Math.max(1, playerNames.length));
const shuffled = [...playerNames].sort(() => 0.5 - Math.random());
const selectedImpostors = shuffled.slice(0, numImpostors);

const category = promptCategories[Math.floor(Math.random() * promptCategories.length)];
const canonicalReal = category.real;
const updatedPlayers = {};

playerNames.forEach(p => {
  if (selectedImpostors.includes(p)) {
    const variant = category.impostors[Math.floor(Math.random() * category.impostors.length)];
    updatedPlayers[p] = { question: variant, vote: "" };
  } else updatedPlayers[p] = { question: canonicalReal, vote: "" };
});

await update(roomRef, { players: updatedPlayers, impostors: selectedImpostors, realQuestion: canonicalReal, phase: "answer", timerEnd: Date.now() + 60 * 1000 });
```

};

const castVote = async targetName => {
if (!roomCode || !name) return;
await set(ref(database, `rooms/${roomCode}/players/${name}/vote`), targetName);
};

const startGame = async () => {
if (name !== creator) return alert("Only creator can start.");
await startRound();
};

const nextRound = async () => {
if (name !== creator) return alert("Only creator can start next round.");
await startRound();
};

const initials = n => n ? n.split(" ").map(s => s[0].toUpperCase()).slice(0,2).join("") : "?";
const playerVoted = p => !!players[p]?.vote;

// ---------------- RENDER ----------------
return ( <div className="p-6 max-w-4xl mx-auto font-mono text-white bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 min-h-screen"> <AnimatePresence>{phase === "reveal" && impostors.length > 0 && <Confetti />}</AnimatePresence>

```
  <header className="flex justify-between items-center mb-6">
    <h1 className="text-3xl font-bold">Guess The Liar</h1>
    <div className="text-right text-sm">
      Room: <strong>{roomCode || "—"}</strong><br/>
      You: <strong>{name || "anonymous"}</strong>
    </div>
  </header>

  {phase === "lobby" && (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl text-black">
        <h2 className="text-2xl font-bold mb-2">Lobby</h2>
        <input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} className="p-2 mb-2 w-full border rounded"/>
        <input placeholder="Room code" value={roomCode} onChange={e=>setRoomCode(e.target.value)} className="p-2 mb-2 w-full border rounded"/>
        <div className="flex gap-2">
          <button onClick={createRoom} className="px-4 py-2 bg-teal-500 rounded hover:bg-teal-600">Create</button>
          <button onClick={joinRoom} className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600">Join</button>
          {name===creator && <button onClick={startGame} className="px-4 py-2 bg-green-500 rounded hover:bg-green-600">Start</button>}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl text-black">
        <h3 className="text-xl font-bold mb-2">Players</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(players).length===0 ? <div className="text-gray-500">No players yet</div> :
            Object.entries(players).map(([p,data]) => (
              <div key={p} className={`p-2 rounded border ${p===creator?"border-yellow-400":"border-gray-300"} flex justify-between`}>
                <span>{initials(p)} {p===creator?"(host)":""}</span>
                <span className={playerVoted(p)?"text-green-500":"text-gray-400"}>{playerVoted(p)?"Voted":"Not voted"}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )}

  {(phase==="answer" || phase==="debate") && (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-white p-6 rounded-xl text-black mt-6">
      <h2 className="text-2xl font-bold mb-2">{phase==="answer"?"Answer Phase":"Debate Phase"}</h2>
      {phase==="answer" && <p className="mb-2">Your private question:</p>}
      {phase==="debate" && <p className="mb-2">Real question for debate: <strong>{realQuestion}</strong></p>}
      <div className="text-lg font-bold">{players[name]?.question || "Waiting..."}</div>
      <div className="mt-2 text-sm">Time left: {timeLeft}s</div>
    </motion.div>
  )}

  {phase==="debate" && (
    <div className="flex flex-wrap gap-2 mt-4">
      {Object.keys(players).map(p => (
        <button key={p} onClick={()=>castVote(p)} disabled={players[name]?.vote===p} className={`px-3 py-1 rounded ${players[name]?.vote===p?"bg-green-200 border-green-500":"bg-white border"} border`}>
          Vote {p}
        </button>
      ))}
    </div>
  )}

  {phase==="reveal" && (
    <div className="bg-white p-6 rounded-xl text-black mt-6">
      <h2 className="text-2xl font-bold mb-2">Reveal Phase</h2>
      <p>Real question: <strong>{realQuestion}</strong></p>
      <p>Impostor(s): <strong>{impostors.join(", ") || "None"}</strong></p>
      <ul className="mt-2">
        {Object.entries(players).map(([p,data]) => (
          <li key={p}>{p} voted for {data.vote || "Nobody"}</li>
        ))}
      </ul>
      {name===creator && <button onClick={nextRound} className="px-4 py-2 mt-4 bg-teal-500 rounded hover:bg-teal-600">Next Round</button>}
    </div>
  )}
</div>
```

);
}

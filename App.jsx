import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// ----- Replace this with your Firebase config -----
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};
// --------------------------------------------------

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function genRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const SAMPLE_PROMPTS = [
  { id: uuidv4(), text: "What's the correct amount of money to spend on a first date?", impostorPrompts: ["Pick a dollar range between $20-500", "Choose a specific amount in dollars"] },
  { id: uuidv4(), text: "What's the best pet for a small apartment?", impostorPrompts: ["Pick a dinosaur instead", "Choose a car model"] },
  { id: uuidv4(), text: "What's the most reliable weekday to book a flight?", impostorPrompts: ["Pick a month instead", "Choose a random number between 1-31"] },
];
const SAMPLE_PEOPLE = ["Harry Potter", "A dentist", "Dog", "Albert Einstein", "Pikachu", "A pizza chef"];

export default function App() {
  const [displayName, setDisplayName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [user, setUser] = useState(null); // firebase user
  const [mode, setMode] = useState("prompt");
  const [isHost, setIsHost] = useState(false);
  const [availablePrompts, setAvailablePrompts] = useState(SAMPLE_PROMPTS);
  const [availablePeople, setAvailablePeople] = useState(SAMPLE_PEOPLE);

  useEffect(() => {
    // Sign in anonymously on load (keeps user persistent across sessions until they clear storage)
    signInAnonymously(auth).catch((err) => console.error("Anon sign-in failed", err));
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  async function createRoom() {
    if (!user) return alert("Still signing in — try again in a second");
    const code = genRoomCode();
    const roomRef = doc(db, "rooms", code);
    const playerObj = { id: user.uid, name: displayName || randomName(), joinedAt: Date.now() };

    const roomData = {
      code,
      hostId: user.uid,
      createdAt: Date.now(),
      players: [playerObj],
      started: false,
      mode: mode,
      currentPrompt: null,
      roles: {},
      impostorCount: null,
      round: 0,
    };

    await setDoc(roomRef, roomData);
    setIsHost(true);
    subscribeToRoom(code);
  }

  async function joinRoom(code) {
    if (!user) return alert("Still signing in — try again in a second");
    const roomRef = doc(db, "rooms", code.toUpperCase());
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return alert("Room not found");

    const playerObj = { id: user.uid, name: displayName || randomName(), joinedAt: Date.now() };
    const current = snap.data();
    const updatedPlayers = [...(current.players || []), playerObj];
    await setDoc(roomRef, { ...current, players: updatedPlayers });

    setIsHost(current.hostId === user.uid);
    subscribeToRoom(code.toUpperCase());
  }

  function subscribeToRoom(code) {
    const roomRef = doc(db, "rooms", code);
    const unsub = onSnapshot(roomRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setCurrentRoom({ id: snap.id, ...data });
      setPlayers(data.players || []);
      setIsHost(data.hostId === (user && user.uid));
    });
  }

  async function leaveRoom() {
    if (!currentRoom || !user) return;
    const roomRef = doc(db, "rooms", currentRoom.code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const filtered = (data.players || []).filter((p) => p.id !== user.uid);
    await setDoc(roomRef, { ...data, players: filtered });

    setCurrentRoom(null);
    setPlayers([]);
    setIsHost(false);
  }

  async function startRound() {
    if (!currentRoom) return;
    const roomRef = doc(db, "rooms", currentRoom.code);
    const participants = currentRoom.players || [];
    const maxImpostors = Math.max(1, Math.floor(participants.length / 3));
    const impostorCount = currentRoom.impostorCount === null || currentRoom.impostorCount === undefined
      ? (Math.random() < 0.2 ? 0 : Math.floor(Math.random() * (maxImpostors + 1)))
      : currentRoom.impostorCount;

    let chosen = null;
    if (currentRoom.mode === "prompt") {
      const pool = availablePrompts;
      chosen = pool[Math.floor(Math.random() * pool.length)];
    } else {
      const pool = availablePeople;
      const item = pool[Math.floor(Math.random() * pool.length)];
      chosen = { text: item };
    }

    const ids = participants.map((p) => p.id);
    const shuffled = shuffle(ids);
    const impostorIds = impostorCount > 0 ? shuffled.slice(0, Math.min(impostorCount, shuffled.length)) : [];
    const roles = {};
    ids.forEach((id) => { roles[id] = impostorIds.includes(id) ? "impostor" : "crewmate"; });

    const nextRound = (currentRoom.round || 0) + 1;
    await setDoc(roomRef, { ...currentRoom, started: true, round: nextRound, currentPrompt: chosen, roles, impostorCount, lastStartedAt: Date.now() });
  }

  function amIImpostor() { if (!currentRoom || !user) return false; return (currentRoom.roles || {})[user.uid] === "impostor"; }

  async function endRound() { if (!currentRoom) return; const roomRef = doc(db, "rooms", currentRoom.code); await setDoc(roomRef, { ...currentRoom, started: false, currentPrompt: null, roles: {}, impostorCount: null }); }

  async function updateRoomSettings(updates) { if (!currentRoom) return; const roomRef = doc(db, "rooms", currentRoom.code); await setDoc(roomRef, { ...currentRoom, ...updates }); }

  if (!currentRoom) {
    return (
      <div style={{fontFamily:'sans-serif', padding:20}}>
        <h1>Guess The Liar</h1>
        <p>Anonymous play: users sign in automatically (no accounts). Recommended deployment: Vercel (one-click from GitHub).</p>

        <div style={{marginTop:12}}>
          <label>Your display name (optional)</label>
          <input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} placeholder="e.g. Aunt Lisa" style={{marginLeft:8}} />
        </div>

        <div style={{marginTop:12}}>
          <label>Mode</label>
          <select value={mode} onChange={(e)=>setMode(e.target.value)} style={{marginLeft:8}}>
            <option value="prompt">Prompt mode</option>
            <option value="guess">Guess mode</option>
          </select>
        </div>

        <div style={{marginTop:12}}>
          <button onClick={createRoom} style={{marginRight:8}}>Create private lobby</button>
          <input value={roomCodeInput} onChange={(e)=>setRoomCodeInput(e.target.value)} placeholder="Room code" style={{marginRight:8}} />
          <button onClick={()=>joinRoom(roomCodeInput)}>Join</button>
        </div>

        <div style={{marginTop:12,fontSize:13,color:'#555'}}>
          <strong>Deploy steps (quick):</strong>
          <ol>
            <li>Create a Firebase project, enable Firestore and Authentication → Anonymous sign-in. (See Firebase docs.)</li>
            <li>Replace firebaseConfig in this file with your project's config.</li>
            <li>Push the project to GitHub and import it into Vercel (or Netlify). Vercel detects React automatically. See Vercel guide.</li>
            <li>Share the Vercel link with family.</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div style={{fontFamily:'sans-serif',padding:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h2>Room {currentRoom.code}</h2>
          <div>Round: {currentRoom.round || 0} • Mode: {currentRoom.mode}</div>
        </div>
        <div>
          <div>You: {displayName || (players.find((p)=>p.id===user?.uid)||{}).name}</div>
          <div style={{marginTop:8}}>
            <button onClick={leaveRoom} style={{marginRight:6}}>Leave</button>
            {isHost && <button onClick={startRound} style={{marginRight:6}}>Start Round</button>}
            {isHost && <button onClick={()=>updateRoomSettings({mode: currentRoom.mode==='prompt'?'guess':'prompt'})}>Toggle Mode</button>}
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:20,marginTop:20}}>
        <div style={{flex:2}}>
          <div style={{padding:12,background:'#f7f7f7',borderRadius:8}}>
            <h3>Players</h3>
            <ul>
              {players.map(p=> <li key={p.id}>{p.name} {p.id===currentRoom.hostId?'(Host)':''} — {currentRoom.roles && currentRoom.roles[p.id]?currentRoom.roles[p.id]:(currentRoom.started?'Playing':'Waiting')}</li>)}
            </ul>
          </div>

          <div style={{marginTop:12,padding:12,background:'#f7f7f7',borderRadius:8}}>
            <h3>Round / Prompt</h3>
            {!currentRoom.started && <div>Round not started.</div>}
            {currentRoom.started && <div>
              <div>Round {currentRoom.round}</div>
              <div style={{marginTop:8}}>Prompt: {currentRoom.currentPrompt?.text || currentRoom.currentPrompt}</div>
              <div style={{marginTop:8}}>Impostor? {amIImpostor()? 'Yes — you have a different prompt' : 'No — you see the normal prompt'}</div>
              <div style={{marginTop:8}}><button onClick={endRound}>End Round</button></div>
            </div>}
          </div>
        </div>

        <div style={{flex:1}}>
          <div style={{padding:12,background:'#f7f7f7',borderRadius:8}}>
            <h4>Room Info</h4>
            <div>Code: <strong>{currentRoom.code}</strong></div>
            <div>Players: {players.length}</div>
            <div>Mode: {currentRoom.mode}</div>
          </div>

          <div style={{marginTop:12,padding:12,background:'#f7f7f7',borderRadius:8}}>
            <h4>Your role</h4>
            <div>{currentRoom.started ? (amIImpostor()? 'IMPOSTOR' : 'CREWMATE') : 'Waiting for round start'}</div>
          </div>

          <div style={{marginTop:12,padding:12,background:'#f7f7f7',borderRadius:8}}>
            <h4>Sample prompts</h4>
            <ul>{availablePrompts.slice(0,5).map(p=> <li key={p.id}>{p.text}</li>)}</ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function randomName(){
  const adjectives = ['Blue','Red','Green','Sneaky','Jolly','Quiet'];
  const animals = ['Panda','Otter','Fox','Elephant','Mouse','Koala'];
  return adjectives[Math.floor(Math.random()*adjectives.length)] + ' ' + animals[Math.floor(Math.random()*animals.length)];
}

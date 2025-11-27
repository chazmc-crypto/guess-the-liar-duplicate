import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, get } from "firebase/database";

// Firebase configuration (yours)
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

/*
  Reworked promptCategories: for each category we have:
    - real: canonical question shown to non-impostors and revealed after answer phase
    - impostors: array of 3 related impostor variants (twists/opposites)
  (I used your categories and gave each 3 impostor variants)
*/
const promptCategories = [
  {
    name: "Date Spending",
    real: "What is your ideal first-date plan?",
    impostors: [
      "Describe the worst first-date budget you can imagine.",
      "Pick a dollar range between $20–$200 you think is outrageous.",
      "What's the most expensive first-date you would pretend to like?"
    ]
  },
  {
    name: "Movies",
    real: "What's your favorite movie?",
    impostors: [
      "Name the worst movie of all time.",
      "Pick a movie that nobody should watch.",
      "What's a movie that deserves zero stars?"
    ]
  },
  {
    name: "Sex Life",
    real: "How many times per week is healthy for a couple?",
    impostors: [
      "Pick a number 1–10 for how often a couple should hook up (wild guess).",
      "Name an outrageous frequency for sex you think is funny.",
      "Describe a sex schedule that would be impossible to keep."
    ]
  },
  {
    name: "Drinks",
    real: "What's your favorite drink (alcoholic or non-alcoholic)?",
    impostors: [
      "Name a disgusting drink you would never try.",
      "Pick a crazy drink combination you'd pretend is normal.",
      "Describe a drink that should not exist."
    ]
  },
  {
    name: "Food",
    real: "What's your go-to comfort food?",
    impostors: [
      "Pick the grossest food you can imagine.",
      "Name a food you'd refuse to eat ever.",
      "Describe the worst tasting dish possible."
    ]
  },
  {
    name: "Vacation",
    real: "What's the best vacation spot you've been to or want to visit?",
    impostors: [
      "Name a terrible vacation location you'd avoid.",
      "Pick a dangerous place you'd never go.",
      "Describe an impossible vacation (e.g., sinkhole island)."
    ]
  },
  {
    name: "Music",
    real: "Which song or artist do you listen to most?",
    impostors: [
      "Name the worst song ever made.",
      "Pick a genre that ruins music for everyone.",
      "Choose a track that makes people cringe."
    ]
  },
  {
    name: "Celebrity Crush",
    real: "Who is your celebrity crush?",
    impostors: [
      "Pick a celebrity nobody finds attractive.",
      "Name a fictional person as your crush.",
      "Choose a celebrity you think is overrated."
    ]
  },
  {
    name: "Hobbies",
    real: "What's your favorite hobby?",
    impostors: [
      "Name the most boring hobby imaginable.",
      "Pick a pastime that seems dangerous.",
      "Describe a hobby nobody would try."
    ]
  },
  {
    name: "Superpowers",
    real: "Which superpower would you want?",
    impostors: [
      "Pick the most useless superpower you can think of.",
      "Name a superpower that would be a curse, not a gift.",
      "Choose a villain's power you'd never take."
    ]
  },
  {
    name: "Pets",
    real: "What's your favorite pet (dog/cat/other)?",
    impostors: [
      "Pick a terrifying pet to keep at home.",
      "Name a creature no one should adopt.",
      "Describe a fictional pet from a nightmare."
    ]
  },
  {
    name: "Fashion",
    real: "What's a fashion trend you like?",
    impostors: [
      "Pick the ugliest clothing item you can imagine.",
      "Name a trend that should never come back.",
      "Describe an outfit that breaks every rule."
    ]
  },
  {
    name: "Games",
    real: "What's your favorite game (board or video)?",
    impostors: [
      "Name the worst game you've played.",
      "Pick a game nobody should play.",
      "Describe a game with impossible rules."
    ]
  },
  {
    name: "Childhood",
    real: "What's your favorite childhood memory?",
    impostors: [
      "Name a nightmare you had as a kid.",
      "Pick a toy nobody liked.",
      "Describe a creepy memory that didn't happen."
    ]
  },
  {
    name: "Drugs",
    real: "What's a legal treat or indulgence you enjoy?",
    impostors: [
      "Name the most disgusting illegal thing you can imagine.",
      "Pick a dangerous substance you'd never touch.",
      "Describe a pretend drug from fiction."
    ]
  }
  // Add more categories later as you like...
];

/* ---------- App component ---------- */
export default function App() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState({}); // { name: { question, vote } }
  const [impostors, setImpostors] = useState([]); // array of names
  const [phase, setPhase] = useState("lobby"); // lobby | answer | debate | reveal
  const [timerEnd, setTimerEnd] = useState(null);
  const [creator, setCreator] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [realQuestion, setRealQuestion] = useState(""); // canonical real question for the round

  // subscribe to room changes
  useEffect(() => {
    if (!roomCode) return;
    const roomRef = ref(database, `rooms/${roomCode}`);
    const unsub = onValue(roomRef, (snapshot) => {
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

  // timer countdown and automatic phase progression
  useEffect(() => {
    if (!timerEnd || phase === "lobby" || phase === "reveal") return;
    const tick = setInterval(async () => {
      const remain = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      setTimeLeft(remain);

      if (remain <= 0) {
        const roomRef = ref(database, `rooms/${roomCode}`);
        const snap = await get(roomRef);
        if (!snap.exists()) return;

        // transition from answer -> debate (show realQuestion during debate)
        if (phase === "answer") {
          await update(roomRef, {
            phase: "debate",
            timerEnd: Date.now() + 3 * 60 * 1000 // 3 minutes debate
          });
        } else if (phase === "debate") {
          await update(roomRef, {
            phase: "reveal",
            timerEnd: null
          });
        }
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [timerEnd, phase, roomCode]);

  /* ---------- Room management ---------- */

  // create room (only sets creator & initial player)
  const createRoom = async () => {
    if (!name) {
      alert("Enter your display name first.");
      return;
    }
    // generate 4-digit code that doesn't always start with 0
    const code = Math.floor(Math.random() * 9000 + 1000).toString();
    setRoomCode(code);
    const playerObj = { [name]: { question: "", vote: "" } };
    await set(ref(database, `rooms/${code}`), {
      players: playerObj,
      impostors: [],
      phase: "lobby",
      timerEnd: null,
      creator: name,
      realQuestion: ""
    });
  };

  // join existing room; preserves other players
  const joinRoom = async () => {
    if (!roomCode || !name) {
      alert("Enter a room code and your name.");
      return;
    }

    const roomRef = ref(database, `rooms/${roomCode}`);
    const snap = await get(roomRef);
    if (!snap.exists()) {
      alert("Room not found.");
      return;
    }

    // set this player entry (will not delete others)
    await set(ref(database, `rooms/${roomCode}/players/${name}`), {
      question: "",
      vote: ""
    });
  };

  // start a new round (creator only)
  const startRound = async () => {
    if (!roomCode) return;
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snap = await get(roomRef);
    if (!snap.exists()) return;
    const data = snap.val();
    const playerNames = Object.keys(data.players || {});
    if (playerNames.length === 0) return;

    // number of impostors: random between 0 and n-1 (as you requested)
    const numImpostors = Math.floor(Math.random() * Math.max(1, playerNames.length));
    const shuffled = [...playerNames].sort(() => 0.5 - Math.random());
    const selectedImpostors = shuffled.slice(0, numImpostors);

    // pick a category
    const category = promptCategories[Math.floor(Math.random() * promptCategories.length)];
    const canonicalReal = category.real;
    const updatedPlayers = {};

    // assign: non-impostors get canonicalReal, impostors get one impostor variant each
    playerNames.forEach((p, idx) => {
      if (selectedImpostors.includes(p)) {
        // random impostor variant from category.impostors
        const variant = category.impostors[Math.floor(Math.random() * category.impostors.length)];
        updatedPlayers[p] = { question: variant, vote: "" };
      } else {
        updatedPlayers[p] = { question: canonicalReal, vote: "" };
      }
    });

    // update room: players, impostors, realQuestion, phase=answer, timerEnd = now + 60s
    await update(roomRef, {
      players: updatedPlayers,
      impostors: selectedImpostors,
      realQuestion: canonicalReal,
      phase: "answer",
      timerEnd: Date.now() + 60 * 1000
    });
  };

  // vote (any player) — saves their vote in DB
  const castVote = async (targetName) => {
    if (!roomCode || !name) return;
    await set(ref(database, `rooms/${roomCode}/players/${name}/vote`), targetName);
  };

  // convenience: creator starts game (same as startRound)
  const startGame = async () => {
    if (name !== creator) {
      alert("Only the room creator can start the game.");
      return;
    }
    await startRound();
  };

  // next round button (creator)
  const nextRound = async () => {
    if (name !== creator) {
      alert("Only the creator can start the next round.");
      return;
    }
    // reset votes and start a new round
    await startRound();
  };

  /* ---------- UI helpers ---------- */

  // returns initials for small avatar
  const initials = (n) => {
    if (!n) return "?";
    return n.split(" ").map(s => s[0]?.toUpperCase()).slice(0,2).join("");
  };

  // friendly status for each player card (voted / waiting)
  const playerVoted = (p) => {
    return !!players[p]?.vote;
  };

  /* ---------- Render ---------- */

  return (
    <div style={{ fontFamily: "Inter, Arial, sans-serif", padding: 20, maxWidth: 960, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Guess The Liar</h1>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14 }}>Room: <strong>{roomCode || "—"}</strong></div>
          <div style={{ fontSize: 12, color: "#666" }}>You: <strong>{name || "anonymous"}</strong></div>
        </div>
      </header>

      {/* Lobby / controls */}
      {phase === "lobby" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          {/* Left: lobby actions & instructions */}
          <div style={{ padding: 16, border: "1px solid #e6e6e6", borderRadius: 10 }}>
            <h2 style={{ marginTop: 0 }}>Lobby</h2>
            <p style={{ color: "#555" }}>Enter a display name and create or join a private room. Share the room code with family to join.</p>

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
              />
              <input
                placeholder="Room code"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value)}
                style={{ width: 140, padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={createRoom} style={{ padding: "10px 14px", borderRadius: 8, background: "#0ea5a4", color: "white", border: "none", cursor: "pointer" }}>Create Room</button>
              <button onClick={joinRoom} style={{ padding: "10px 14px", borderRadius: 8, background: "#60a5fa", color: "white", border: "none", cursor: "pointer" }}>Join Room</button>
              {name && creator === name && (
                <button onClick={startGame} style={{ padding: "10px 14px", borderRadius: 8, background: "#10b981", color: "white", border: "none", cursor: "pointer" }}>Start Game</button>
              )}
            </div>

            <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid #f0f0f0" }} />

            <p style={{ margin: 0, color: "#666" }}>
              Game flow:
              <ul style={{ color: "#666" }}>
                <li>Answer phase — 60s: players read their question (in RL they answer out loud).</li>
                <li>Debate phase — 3m: the app shows the real question to everyone for fair debate.</li>
                <li>Vote & Reveal: votes are shown after reveal and the impostor(s) are revealed.</li>
              </ul>
            </p>
          </div>

          {/* Right: player grid (fancy cards) */}
          <div style={{ padding: 16, border: "1px solid #e6e6e6", borderRadius: 10 }}>
            <h3 style={{ marginTop: 0 }}>Players</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {Object.keys(players).length === 0 && <div style={{ color: "#888" }}>No players yet</div>}
              {Object.entries(players).map(([p, pdata]) => (
                <div key={p} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  borderRadius: 8,
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  border: p === creator ? "1px solid #fde68a" : "1px solid #f1f5f9"
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: p === creator ? "#fef3c7" : "#eef2ff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, color: "#111"
                  }}>
                    {initials(p)}
                  </div>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{p}{p === creator ? " (host)" : ""}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{players[p].question ? "Ready" : "Joined"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: playerVoted(p) ? "#059669" : "#888" }}>
                      {playerVoted(p) ? "Voted" : "Not voted"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Answer phase: show each player's individual question (impostor sees their variant) */}
      {phase === "answer" && (
        <div style={{ padding: 20, borderRadius: 10, border: "1px solid #eee", background: "#ffffff" }}>
          <h2>Answer Phase</h2>
          <p style={{ color: "#444", marginTop: 6 }}>Look at your question below and answer it out loud with family.<br />
            You will not submit answers in the app — debate and voting happen after the timer.</p>

          <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 700, padding: 18, borderRadius: 12, background: "#fafafa", border: "1px solid #f0f0f0" }}>
              <div style={{ fontSize: 14, color: "#888" }}>Your private prompt</div>
              <div style={{ marginTop: 12, padding: 14, borderRadius: 8, background: "#fff", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.02)" }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{players[name]?.question || "Waiting for assignment..."}</div>
                <div style={{ marginTop: 8, color: "#666" }}>
                  Time left: <strong>{timeLeft}s</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debate phase: show canonical realQuestion so everyone's debating the same topic, then vote */}
      {phase === "debate" && (
        <div style={{ padding: 20, borderRadius: 10, border: "1px solid #eee", background: "#ffffff" }}>
          <h2>Debate Phase</h2>
          <p style={{ color: "#444" }}>The real question (what non-impostors had):</p>

          <div style={{ margin: "12px auto", maxWidth: 720 }}>
            <div style={{ padding: 16, borderRadius: 10, background: "#f8fafc", border: "1px solid #eef2ff" }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{realQuestion || "—"}</div>
              <div style={{ marginTop: 8, color: "#666" }}>
                Debate out loud with family. When you're ready, cast your vote in the app for who you think is the impostor.
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.keys(players).map(p => (
                <button
                  key={p}
                  onClick={() => castVote(p)}
                  disabled={players[name]?.vote === p}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: players[name]?.vote === p ? "2px solid #10b981" : "1px solid #e6e6e6",
                    background: players[name]?.vote === p ? "#ecfdf5" : "#fff",
                    cursor: players[name]?.vote === p ? "default" : "pointer"
                  }}
                >
                  Vote {p}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 12, color: "#444" }}>
              <strong>Your vote:</strong> {players[name]?.vote || "None"} • <strong>Time left:</strong> {timeLeft}s
            </div>
          </div>
        </div>
      )}

      {/* Reveal phase: show impostors and players' votes */}
      {phase === "reveal" && (
        <div style={{ padding: 20, borderRadius: 10, border: "1px solid #eee", background: "#ffffff" }}>
          <h2>Reveal</h2>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 16 }}>
              Real question: <strong>{realQuestion || "—"}</strong>
            </div>
            <div style={{ marginTop: 8, color: "#666" }}>
              Impostor(s): <strong>{impostors.length ? impostors.join(", ") : "None"}</strong>
            </div>
          </div>

          <div style={{ textAlign: "left", maxWidth: 720, margin: "0 auto" }}>
            <h4>Votes</h4>
            <ul>
              {Object.entries(players).map(([p, data]) => (
                <li key={p} style={{ padding: "6px 0" }}>
                  <strong>{p}</strong> voted for <em>{data.vote || "Nobody"}</em>
                </li>
              ))}
            </ul>
          </div>

          {name === creator && (
            <div style={{ marginTop: 16 }}>
              <button onClick={nextRound} style={{ padding: "10px 16px", borderRadius: 8, background: "#06b6d4", color: "white", border: "none" }}>
                Next Round
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

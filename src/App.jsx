
import React, { useEffect, useState } from "react";
import { getDatabase, ref, set, onValue, update, get } from "firebase/database";

// NOTE: Firebase should be initialized once in main.jsx using initializeApp(firebaseConfig).
// This file assumes the default Firebase app has already been initialized (see src/main.jsx).
const database = getDatabase();

// Sanitize strings for Firebase paths — replace characters that are not allowed in Realtime Database keys
const sanitize = (str = "") =>
  String(str).replace(/[.\#\$\[\]\s]/g, "_").trim();

const isValidPath = (str = "") => {
  const s = String(str);
  // must not be empty and must not contain . # $ [ ] or whitespace
  return s.trim() !== "" && !/[.\#\$\[\]\s]/.test(s);
};

// Generate 200 real-ish prompts.
// These are intentionally varied to be usable in the game.
// If you want completely different prompts, tell me and I can replace them.
const promptCategories = [
  "What's your favorite childhood memory?",
  "What's a hobby you secretly enjoy?",
  "If you could travel anywhere tomorrow, where would you go?",
  "What's your go-to comfort food?",
  "What's the last book you couldn't put down?",
  "What's a skill you wish you learned earlier?",
  "What's a movie you love but most people haven't seen?",
  "What's your favorite way to spend a rainy day?",
  "What's the weirdest job you've ever had?",
  "What's your favorite ice cream flavor?",
  "If you could have dinner with one fictional character, who would it be?",
  "What's a song you always sing along to?",
  "What's the best advice you've ever received?",
  "What's a pet peeve that really bugs you?",
  "What's a place in your hometown you miss?",
  "What's a food you absolutely hate?",
  "What's a board game you always win at?",
  "What's a small purchase that made your life better?",
  "What's the last show you binge-watched?",
  "What's a tradition your family does every year?",
  "What's your favorite season and why?",
  "What's a superpower you'd pick for a day?",
  "What's your most-used emoji?",
  "What's a habit you want to start?",
  "What's the strangest souvenir you've bought while traveling?",
  "What's your favorite time of day?",
  "What's a language you'd like to learn?",
  "What's your favorite dessert?",
  "What's a hidden gem city you recommend?",
  "What's your favorite outdoor activity?",
  "What's a food you could eat every day?",
  "What's your favorite smell?",
  "What's a piece of clothing you can't live without?",
  "What's your favorite way to relax after work?",
  "What's a challenge you overcame recently?",
  "What's your favorite childhood TV show?",
  "What's the best meal you've ever had?",
  "What's a hobby you'd like to try?",
  "What's an app you use every day?",
  "What's a guilty pleasure TV show?",
  "What's the most unusual food you've tried?",
  "What's your favorite coffee order?",
  "What's a goal you're working on right now?",
  "What's your favorite holiday?",
  "What's the last photo you took?",
  "What's your favorite icebreaker question?",
  "What's a song that reminds you of summer?",
  "What's your dream job as a kid?",
  "What's a city you'd love to live in for a year?",
  "What's your favorite snack?",
  "What's a habit you are proud of?",
  "What's the best gift you've ever received?",
  "What's your favorite quote?",
  "What's your favorite thing about your current city?",
  "What's a sport you'd like to learn?",
  "What's the first concert you attended?",
  "What's a guilty pleasure food?",
  "What's your favorite app feature?",
  "What's a movie that made you cry?",
  "What's something you always carry with you?",
  "What's a fashion trend you secretly like?",
  "What's your favorite childhood book?",
  "What's a random skill you can teach someone?",
  "What's a food that brings back memories?",
  "What's the best piece of advice you would give your younger self?",
  "What's a dream you still want to accomplish?",
  "What's a scent that takes you back to a place?",
  "What's your favorite pizza topping?",
  "What's a moment that made you proud recently?",
  "What's a podcast you recommend?",
  "What's something that makes your day better instantly?",
  "What's your favorite public holiday dish?",
  "What's a place you'd go for a digital detox?",
  "What's the best thing about being your age?",
  "What's a superstition you (or your family) follow?",
  "What's a tradition you'd like to start?",
  "What's a weird fact you know?",
  "What's a hobby you wish you had more time for?",
  "What's the most adventurous thing you've done?",
  "What's a skill that makes you feel accomplished?",
  "What's a comfort movie you rewatch often?",
  "What's a topic you could talk about for hours?",
  "What's your favorite way to celebrate small wins?",
  "What's your favorite local restaurant?",
  "What's something you learned recently that surprised you?",
  "What's your favorite childhood game?",
  "What's a difficult decision you made that paid off?",
  "What's a decorative item in your home you love?",
  "What's something you wish schools taught?",
  "What's a technology you can't live without?",
  "What's an unusual tradition in your family?",
  "What's a memorable compliment you received?",
  "What's one thing you refuse to share?",
  "What's a way you like to be thanked?",
  "What's a cultural event you enjoy attending?",
  "What's your favorite road trip snack?",
  "What's a project you completed recently?",
  "What's a dish you cook that impresses people?",
  "What's your favorite museum or gallery?",
  "What's a way you unwind on weekends?",
  "What's a memory that always makes you smile?",
  "What's a phrase you overuse?",
  "What's a product you recommend to friends?",
  "What's a tech gadget you'd love to own?",
  "What's the most thoughtful gift you gave someone?",
  "What's a small change that improved your routine?",
  "What's your favorite fast-food order?",
  "What's a lesson you learned from failure?",
  "What's a song you know all the lyrics to?",
  "What's your favorite way to get exercise?",
  "What's the best surprise you've ever received?",
  "What's a festival or market you love?",
  "What's a local spot you'd take a visitor to?",
  "What's a food you tried and ended up loving?",
  "What's a thing you collect or used to collect?",
  "What's your favorite way to start the morning?",
  "What's a sound that relaxes you?",
  "What's a classroom subject you enjoyed most?",
  "What's the longest book you've read?",
  "What's your favorite thing to bake or cook?",
  "What's the best advice you've given someone else?",
  "What's a place you keep returning to?",
  "What's a challenge you want to tackle next year?",
  "What's a cool tradition from another culture you like?",
  "What's the earliest memory you have?",
  "What's a guilty pleasure snack you hide?",
  "What's your favorite thing about meeting new people?",
  "What's a habit you dropped that improved your life?",
  "What's a holiday you always look forward to?",
  "What's something you grew out of that you miss?",
  "What's a compliment that always makes you smile?",
  "What's the quirkiest thing in your room?",
  "What's your favorite way to learn new things?",
  "What's a way you show support to friends?",
  "What's a time you felt completely at ease?",
  "What's your favorite app for productivity?",
  "What's a historical era you'd like to visit?",
  "What's a food pairing you unexpectedly love?",
  "What's your favorite way to spend a Sunday afternoon?",
  "What's an item on your bucket list?",
  "What's the most beautiful place you've seen?",
  "What's a challenge you've solved creatively?",
  "What's a habit that helps your focus?",
  "What's the last thing you fixed yourself?",
  "What's your favorite beverage (non-alcoholic)?",
  "What's a funny misunderstanding you've had?",
  "What's something you learned from a grandparent?",
  "What's a niche hobby you enjoy?",
  "What's your favorite comfort outfit?",
  "What's an underrated skill people should learn?",
  "What's the best public transport experience you've had?",
  "What's your favorite local dessert?",
  "What's a place that surprised you in a good way?",
  "What's a rule you always follow while traveling?",
  "What's your favorite childhood snack?",
  "What's a piece of advice you wish you'd followed sooner?",
  "What's one word that describes your sense of humor?",
  "What's a memory that taught you empathy?",
  "What's your favorite thing to do outdoors?",
  "What's a creative outlet you rely on?",
  "What's the best compliment you've ever given someone?",
  "What's a small ritual you do before bedtime?",
  "What's your favorite part of the day at work?",
  "What's something you wish you did more often?"
].map((q, i) => ({
  name: `Prompt ${i + 1}`,
  real: q,
  // create a few impostor variants by slightly altering the phrasing
  impostors: [
    `${q} (short answer)`,
    `${q} — give a surprising answer`,
    `If asked differently: ${q.toLowerCase()}`
  ]
}));

// Simple similarity function (token overlap)
const similarityScore = (a = "", b = "") => {
  const setA = new Set(String(a).toLowerCase().split(/\s+/).filter(Boolean));
  const setB = new Set(String(b).toLowerCase().split(/\s+/).filter(Boolean));
  const inter = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size ? inter.size / union.size : 0;
};

// Helper to create avatar color from name
const colorFromString = (s = "") => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 55%)`;
};

function Avatar({ name, size = 40 }) {
  const initials = (name || "Anon").split(/[_\s]+/).map(p => p[0]).slice(0,2).join("").toUpperCase();
  const bg = colorFromString(name || "anon");
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: "700", boxShadow: "0 4px 18px rgba(0,0,0,0.4)",
      fontSize: Math.max(12, size/3), textShadow: "0 1px 2px rgba(0,0,0,0.4)"
    }}>{initials}</div>
  );
}

export default function App() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState({});
  const [impostors, setImpostors] = useState([]);
  const [phase, setPhase] = useState("lobby");
  const [timerEnd, setTimerEnd] = useState(null);
  const [creator, setCreator] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [realQuestion, setRealQuestion] = useState("");
  const [round, setRound] = useState(1);
  const [selectedVotes, setSelectedVotes] = useState([]);
  const [confetti, setConfetti] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("canvas-confetti").then(mod => setConfetti(() => mod.default)).catch(() => {});
    }
  }, []);

  // Listen for room updates and automatically advance phases when everyone has submitted
  useEffect(() => {
    if (!roomCode) return;
    const sanitizedCode = sanitize(roomCode);
    const roomRef = ref(database, `rooms/${sanitizedCode}`);
    const unsub = onValue(roomRef, async snapshot => {
      const data = snapshot.val();
      if (!data) {
        setPlayers({});
        setImpostors([]);
        setPhase("lobby");
        setTimerEnd(null);
        setCreator("");
        setRealQuestion("");
        setRound(1);
        return;
      }
      setPlayers(data.players || {});
      setImpostors(data.impostors || []);
      setPhase(data.phase || "lobby");
      setTimerEnd(data.timerEnd || null);
      setCreator(data.creator || "");
      setRealQuestion(data.realQuestion || "");
      setRound(data.round || 1);

      // Auto-advance logic
      const playersObj = data.players || {};
      const playerKeys = Object.keys(playersObj);

      // If we're in answer phase and every player has non-empty answer -> move to debate
      if (data.phase === "answer" && playerKeys.length > 0) {
        const allAnswered = playerKeys.every(k => {
          const ans = playersObj[k]?.answer;
          return typeof ans === "string" && ans.trim().length > 0;
        });
        if (allAnswered) {
          // set debate phase with 3 minutes timer if not already set
          await update(roomRef, { phase: "debate", timerEnd: Date.now() + 3 * 60 * 1000 });
          return;
        }
      }

      // If we're in debate phase and every player has submitted vote -> move to reveal
      if (data.phase === "debate" && playerKeys.length > 0) {
        const allVoted = playerKeys.every(k => {
          const v = playersObj[k]?.vote;
          // Accept arrays with length > 0 or any non-empty string
          return (Array.isArray(v) && v.length > 0) || (typeof v === "string" && v.trim().length > 0);
        });
        if (allVoted) {
          await update(roomRef, { phase: "reveal", timerEnd: null });
          return;
        }
      }
    });
    return () => unsub();
  }, [roomCode]);

  // Countdown timer (keeps UI timeLeft updated)
  useEffect(() => {
    if (!timerEnd || phase === "lobby" || phase === "reveal") return;
    const tick = setInterval(async () => {
      const remain = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      setTimeLeft(remain);
      if (remain <= 0) {
        const sanitizedCode = sanitize(roomCode);
        const roomRef = ref(database, `rooms/${sanitizedCode}`);
        const snap = await get(roomRef);
        if (!snap.exists()) return;
        const data = snap.val();
        if (data.phase === "answer") {
          await update(roomRef, { phase: "debate", timerEnd: Date.now() + 3 * 60 * 1000 });
        } else if (data.phase === "debate") {
          await update(roomRef, { phase: "reveal", timerEnd: null });
        }
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [timerEnd, phase, roomCode]);

  const createRoom = async () => {
    if (!name || !isValidPath(name)) {
      alert("Enter a valid name (no '.', '#', '$', '[', ']', or spaces)");
      return;
    }
    const code = Math.floor(Math.random() * 9000 + 1000).toString();
    const sanitizedCode = sanitize(code);
    const sanitizedName = sanitize(name);
    setRoomCode(sanitizedCode);
    const playerObj = {};
    playerObj[sanitizedName] = { answer: "", vote: [] };
    await set(ref(database, `rooms/${sanitizedCode}`), {
      players: playerObj,
      impostors: [],
      phase: "lobby",
      timerEnd: null,
      creator: sanitizedName,
      realQuestion: "",
      round: 1
    });
    setCreator(sanitizedName);
  };

  const joinRoom = async () => {
    if (!name || !roomCode) {
      alert("Enter your name and room code");
      return;
    }
    if (!isValidPath(name) || !isValidPath(roomCode)) {
      alert("Name or room code contains invalid characters");
      return;
    }
    const sanitizedName = sanitize(name);
    const sanitizedCode = sanitize(roomCode);
    const roomRef = ref(database, `rooms/${sanitizedCode}`);
    const snap = await get(roomRef);
    if (!snap.exists()) {
      alert("Room not found");
      return;
    }
    await set(ref(database, `rooms/${sanitizedCode}/players/${sanitizedName}`), { answer: "", vote: [] });
  };

  const startRound = async () => {
    if (!roomCode || !isValidPath(roomCode)) return;
    const sanitizedCode = sanitize(roomCode);
    const roomRef = ref(database, `rooms/${sanitizedCode}`);
    const snap = await get(roomRef);
    if (!snap.exists()) return;
    const data = snap.val();
    const playerNames = Object.keys(data.players || {});
    if (!playerNames.length) return;
    const numImpostors = Math.max(1, Math.floor(playerNames.length / 3)); // roughly 1/3rd
    const shuffled = [...playerNames].sort(() => 0.5 - Math.random());
    const selectedImpostors = shuffled.slice(0, numImpostors);
    const category = promptCategories[Math.floor(Math.random() * promptCategories.length)];
    const canonicalReal = category.real || category; // support both shapes
    const updatedPlayers = {};
    playerNames.forEach(p => {
      const sanitized = sanitize(p);
      if (selectedImpostors.includes(p)) {
        const variant = (category.impostors && category.impostors[Math.floor(Math.random() * category.impostors.length)]) || (`${canonicalReal} (impostor)`);
        updatedPlayers[sanitized] = { answer: "", variant, vote: [] };
      } else {
        updatedPlayers[sanitized] = { answer: "", variant: canonicalReal, vote: [] };
      }
    });
    await update(roomRef, {
      players: updatedPlayers,
      impostors: selectedImpostors.map(sanitize),
      realQuestion: canonicalReal,
      phase: "answer",
      timerEnd: Date.now() + 60 * 1000,
      round: data.round || 1
    });
  };

  const toggleVote = (playerName) => {
    setSelectedVotes(prev =>
      prev.includes(playerName) ? prev.filter(p => p !== playerName) : [...prev, playerName]
    );
  };

  const submitVote = async () => {
    if (!roomCode || !name) return;
    const sanitizedName = sanitize(name);
    const sanitizedCode = sanitize(roomCode);
    await set(ref(database, `rooms/${sanitizedCode}/players/${sanitizedName}/vote`), selectedVotes);
    setSelectedVotes([]);
    // the onValue listener will detect all-voted and advance phase automatically
  };

  // Next round (only host)
  const nextRound = async () => {
    if (name !== creator) { alert("Only creator can next round"); return; }
    if (round >= 10) { alert("Game over!"); return; }
    const sanitized = sanitize(roomCode);
    await update(ref(database, `rooms/${sanitized}`), { round: round + 1 });
    setSelectedVotes([]);
    startRound();
  };

  // Confetti for correct votes
  useEffect(() => {
    if (phase === "reveal" && confetti) {
      Object.entries(players).forEach(([p, data]) => {
        if ((data.vote || []).some(v => impostors.includes(v))) {
          try {
            confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
          } catch (e) {}
        }
      });
    }
  }, [phase, players, impostors, confetti]);

  const mostSimilarPairs = () => {
    const names = Object.keys(players);
    const pairs = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const a = players[names[i]]?.answer || "";
        const b = players[names[j]]?.answer || "";
        pairs.push({ pair: [names[i], names[j]], score: similarityScore(a, b) });
      }
    }
    return pairs.sort((a, b) => b.score - a.score).slice(0, 3);
  };

  // Arcade-style UI styles
  const containerStyle = {
    fontFamily: "'Segoe UI', Roboto, system-ui, -apple-system, 'Helvetica Neue', Arial",
    padding: 20,
    maxWidth: 1100,
    margin: "0 auto",
    background: "linear-gradient(180deg, #08121f 0%, #071627 60%, #00121a 100%)",
    color: "#e6f7ff",
    minHeight: "100vh"
  };
  const card = {
    background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 6px 30px rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.06)"
  };

  return (
    <div style={containerStyle}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 1.5, color: "#fff", textShadow: "0 4px 24px rgba(0,180,255,0.15)" }}>
            GUESS THE LIAR
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Arcade Mode</div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.9)" }}>Room: {String(roomCode) || "—"}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Avatar name={name || "anon"} size={40} />
            <div style={{ fontSize: 14 }}>{name || "anon"}</div>
          </div>
        </div>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        <section style={card}>
          {phase === "lobby" && (
            <div>
              <h2 style={{ marginTop: 0 }}>Lobby</h2>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none" }} />
                <input placeholder="Room" value={roomCode} onChange={e => setRoomCode(e.target.value)} style={{ width: 120, padding: 8, borderRadius: 8, border: "none" }} />
                <button onClick={createRoom} style={{ padding: "8px 12px", borderRadius: 8 }}>Create</button>
                <button onClick={joinRoom} style={{ padding: "8px 12px", borderRadius: 8 }}>Join</button>
                {creator === sanitize(name) && <button onClick={startRound} style={{ padding: "8px 12px", borderRadius: 8 }}>Start</button>}
              </div>

              <h3>Players</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.keys(players).map(p => (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 8, background: "rgba(0,0,0,0.12)" }}>
                    <Avatar name={p} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{p}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{p === creator ? "host" : "player"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase === "answer" && (
            <div>
              <h2 style={{ marginTop: 0 }}>Round {round} — Answer</h2>
              <div style={{ marginBottom: 12, fontSize: 16 }}>{/* show player's variant question */}
                <strong>Your prompt:</strong> {String(players[sanitize(name)]?.variant) || "—"}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  value={String(players[sanitize(name)]?.answer || "")}
                  placeholder="Type your answer"
                  onChange={e => {
                    const ans = e.target.value;
                    update(ref(database, `rooms/${sanitize(roomCode)}/players/${sanitize(name)}`), { answer: ans });
                  }}
                  style={{ flex: 1, padding: 12, borderRadius: 8, border: "none" }}
                />
                <div style={{ minWidth: 120, textAlign: "center" }}>
                  <div style={{ fontSize: 12 }}>Time left</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{timeLeft}s</div>
                </div>
              </div>

              <div>
                <h3>Other players' status</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {Object.entries(players).map(([p, data]) => (
                    <div key={p} style={{ padding: 8, borderRadius: 8, background: "rgba(0,0,0,0.08)" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Avatar name={p} size={36} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{p}</div>
                          <div style={{ fontSize: 12, color: data.answer && data.answer.trim() ? "#7affc1" : "rgba(255,255,255,0.5)" }}>
                            {data.answer && data.answer.trim() ? "Answered" : "Waiting..."}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {phase === "debate" && (
            <div>
              <h2 style={{ marginTop: 0 }}>Debate</h2>
              <div style={{ marginBottom: 12 }}><strong>Real question:</strong> {String(realQuestion)}</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.keys(players).map(p => (
                    <button
                      key={p}
                      onClick={() => toggleVote(p)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        border: selectedVotes.includes(p) ? "2px solid #7affc1" : "1px solid rgba(255,255,255,0.08)",
                        background: selectedVotes.includes(p) ? "linear-gradient(90deg, rgba(122,255,193,0.08), rgba(122,255,193,0.02))" : "transparent"
                      }}
                    >
                      <Avatar name={p} size={28} /> <span style={{ marginLeft: 8 }}>{p}</span> {selectedVotes.includes(p) ? "✓" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <button onClick={submitVote} style={{ padding: "10px 14px", borderRadius: 8 }}>Submit Vote</button>
                <span style={{ marginLeft: 12 }}>Time left: {timeLeft}s</span>
              </div>
            </div>
          )}

          {phase === "reveal" && (
            <div>
              <h2 style={{ marginTop: 0 }}>Reveal</h2>
              <div style={{ marginBottom: 8 }}><strong>Impostors:</strong> {impostors.join(", ") || "None"}</div>

              <h3>Votes</h3>
              <ul>
                {Object.entries(players).map(([p, data]) => (
                  <li key={p} style={{ marginBottom: 6 }}>
                    <strong>{p}</strong> voted for {(data.vote || []).join(", ") || "Nobody"}
                  </li>
                ))}
              </ul>

              <h3>Most similar answers</h3>
              <ul>
                {mostSimilarPairs().map((s, i) => (
                  <li key={i}>{s.pair.join(" & ")} — {Math.round(s.score * 100)}%</li>
                ))}
              </ul>

              {creator === sanitize(name) && <button onClick={nextRound} style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8 }}>Next Round</button>}
            </div>
          )}
        </section>

        <aside style={card}>
          <h3 style={{ marginTop: 0 }}>Arcade Sidebar</h3>
          <div style={{ marginBottom: 12 }}>
            <strong>Round:</strong> {round} <br />
            <strong>Phase:</strong> {phase} <br />
            <strong>Host:</strong> {creator}
          </div>

          <div style={{ marginBottom: 12 }}>
            <h4>Prompts</h4>
            <div style={{ maxHeight: 420, overflow: "auto" }}>
              {promptCategories.map((c, i) => (
                <div key={i} style={{ padding: "6px 8px", borderRadius: 6, marginBottom: 6, background: "rgba(255,255,255,0.02)" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{c.real}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4>Players</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.keys(players).map(p => (
                <div key={p} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Avatar name={p} size={28} />
                  <div style={{ fontWeight: 700 }}>{p}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

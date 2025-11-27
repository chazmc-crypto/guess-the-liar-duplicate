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

// FULL PROMPTS ARRAY — FIXED & CLEAN
const promptCategories = [
  {
    name: "Date Spending",
    regular: [
      "What is the ideal first date spending?",
      "Choose a budget for a first date meal",
      "Favorite romantic gesture?",
      "Best way to split a bill on a date?"
    ],
    impostor: [
      "Pick a dollar range between 20-200",
      "Choose an unusual date budget",
      "Suggest a date without spending any money",
      "Pick an outrageously expensive date"
    ]
  },
  {
    name: "Movies",
    regular: [
      "What is your favorite movie?",
      "Best movie of all time?",
      "Favorite film genre?",
      "Movie that always makes you cry?"
    ],
    impostor: [
      "What is the worst movie of all time?",
      "Name a movie no one likes",
      "Pick a movie that doesn't exist",
      "Choose the most confusing film"
    ]
  },
  {
    name: "Sex Life",
    regular: [
      "How many times a week should a couple have sex?",
      "What's a normal number of partners?",
      "What's a healthy relationship habit?",
      "Most romantic time of day?"
    ],
    impostor: [
      "Pick a number 1-10",
      "Name an outrageous frequency",
      "Suggest a bizarre sex habit",
      "Choose a strange romantic ritual"
    ]
  },
  {
    name: "Drinks",
    regular: [
      "What's your favorite alcoholic drink?",
      "Pick a drink you enjoy",
      "Favorite non-alcoholic beverage?",
      "Best drink to start the day?"
    ],
    impostor: [
      "Name a disgusting drink",
      "Pick something you’d never touch",
      "Choose a drink that doesn't exist",
      "Suggest mixing incompatible flavors"
    ]
  },
  {
    name: "Food",
    regular: [
      "Favorite food?",
      "What's your go-to meal?",
      "Preferred breakfast item?",
      "Favorite dessert?"
    ],
    impostor: [
      "Pick the grossest food imaginable",
      "Choose a food no one would eat",
      "Name a food from another planet",
      "Suggest eating raw ingredients only"
    ]
  },
  {
    name: "Vacation",
    regular: [
      "Favorite vacation spot?",
      "Where would you go for a luxury trip?",
      "Dream tropical location?",
      "Favorite city to visit?"
    ],
    impostor: [
      "Name a terrible vacation location",
      "Choose a dangerous destination",
      "Suggest staying in the sewers",
      "Pick a place no one can reach"
    ]
  },
  {
    name: "Music",
    regular: [
      "Favorite song or artist?",
      "Song you listen to on repeat?",
      "Genre you love?",
      "Song that makes you happy?"
    ],
    impostor: [
      "Name the worst song ever",
      "Pick a song nobody likes",
      "Choose a sound that isn't music",
      "Suggest an unplayable instrument"
    ]
  },
  {
    name: "Celebrity Crush",
    regular: [
      "Who is your celebrity crush?",
      "Name a famous person you like?",
      "Dream celebrity date?",
      "Favorite actor/actress?"
    ],
    impostor: [
      "Pick a celebrity nobody finds attractive",
      "Choose a weird celebrity crush",
      "Name someone fictional",
      "Pick an imaginary celebrity"
    ]
  },
  {
    name: "Hobbies",
    regular: [
      "Favorite hobby?",
      "What do you do for fun?",
      "Sport you enjoy?",
      "Creative activity you love?"
    ],
    impostor: [
      "Name a boring hobby",
      "Pick a strange pastime",
      "Suggest a dangerous hobby",
      "Choose a hobby no one knows"
    ]
  },
  {
    name: "Superpowers",
    regular: [
      "Which superpower would you choose?",
      "Favorite superhero ability?",
      "Most useful power?",
      "Dream power for a day?"
    ],
    impostor: [
      "Pick the worst superpower ever",
      "Choose a useless ability",
      "Suggest a harmful power",
      "Pick a power from a villain"
    ]
  },
  {
    name: "Pets",
    regular: [
      "What's your favorite pet?",
      "Do you prefer dogs or cats?",
      "Favorite animal companion?",
      "Pet you'd love to own?"
    ],
    impostor: [
      "Pick a terrifying animal",
      "Name a pet no one wants",
      "Choose a mythological pet",
      "Suggest a dangerous pet"
    ]
  },
  {
    name: "Fashion",
    regular: [
      "Best clothing style?",
      "Pick a fashion trend you like",
      "Favorite accessory?",
      "Comfortable outfit choice?"
    ],
    impostor: [
      "Pick the ugliest clothing",
      "Choose a trend nobody wears",
      "Suggest wearing something illegal",
      "Pick a style from outer space"
    ]
  },
  {
    name: "Games",
    regular: [
      "Favorite board or video game?",
      "Most fun game you've played",
      "Game you always win?",
      "Childhood favorite game?"
    ],
    impostor: [
      "Pick a game everyone hates",
      "Name the worst game ever",
      "Choose an unplayable game",
      "Suggest impossible rules"
    ]
  },
  {
    name: "Childhood",
    regular: [
      "Favorite childhood memory?",
      "Best toy as a kid?",
      "Favorite cartoon?",
      "Game you played outside?"
    ],
    impostor: [
      "Name a nightmare memory",
      "Pick a toy no one liked",
      "Suggest a dangerous childhood activity",
      "Pick a fictional memory"
    ]
  },
  {
    name: "Drugs",
    regular: [
      "What drink or snack is most relaxing?",
      "Favorite legal indulgence?",
      "Comfort food or drink?",
      "Go-to snack?"
    ],
    impostor: [
      "Pick the most disgusting drug",
      "Choose something extremely unsafe",
      "Illegal item",
      "Impossible substance"
    ]
  }
];

export default function App() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState({});
  const [impostors, setImpostors] = useState([]);
  const [phase, setPhase] = useState("lobby");
  const [timerEnd, setTimerEnd] = useState(null);
  const [creator, setCreator] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  // Listen for room changes
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

  // Timer logic
  useEffect(() => {
    if (!timerEnd || phase === "lobby" || phase === "reveal") return;

    const interval = setInterval(async () => {
      const remaining = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        const roomRef = ref(database, `rooms/${roomCode}`);
        const snap = await get(roomRef);
        if (!snap.exists()) return;

        if (phase === "answer") {
          await update(roomRef, {
            phase: "debate",
            timerEnd: Date.now() + 180000
          });
        } else if (phase === "debate") {
          await update(roomRef, { phase: "reveal", timerEnd: null });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerEnd, phase, roomCode]);

  const createRoom = async () => {
    if (!name) return;

    const code = Math.floor(Math.random() * 9000 + 1000).toString();
    setRoomCode(code);

    await set(ref(database, `rooms/${code}`), {
      players: { [name]: { question: "", vote: "" } },
      impostors: [],
      phase: "lobby",
      creator: name
    });
  };

  const joinRoom = async () => {
    if (!roomCode || !name) return;

    const roomRef = ref(database, `rooms/${roomCode}`);
    const snap = await get(roomRef);

    if (!snap.exists()) {
      alert("Room does not exist!");
      return;
    }

    await set(ref(database, `rooms/${roomCode}/players/${name}`), {
      question: "",
      vote: ""
    });
  };

  const startGame = async () => {
    if (name !== creator) return;
    await startRound();
  };

  const startRound = async () => {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snap = await get(roomRef);

    if (!snap.exists()) return;

    const data = snap.val();
    const playerNames = Object.keys(data.players);

    // Random impostors
    const numImpostors = Math.max(1, Math.floor(Math.random() * playerNames.length));
    const shuffled = [...playerNames].sort(() => 0.5 - Math.random());
    const selectedImpostors = shuffled.slice(0, numImpostors);

    // Pick category
    const category = promptCategories[Math.floor(Math.random() * promptCategories.length)];

    // Assign questions
    const updatedPlayers = {};
    playerNames.forEach((p) => {
      updatedPlayers[p] = {
        vote: "",
        question: selectedImpostors.includes(p)
          ? category.impostor[Math.floor(Math.random() * category.impostor.length)]
          : category.regular[Math.floor(Math.random() * category.regular.length)]
      };
    });

    await update(roomRef, {
      players: updatedPlayers,
      impostors: selectedImpostors,
      phase: "answer",
      timerEnd: Date.now() + 60000
    });
  };

  const vote = async (target) => {
    await set(ref(database, `rooms/${roomCode}/players/${name}/vote`), target);
  };

  return (
    <div style={{ fontFamily: "Arial", textAlign: "center", padding: "20px" }}>
      {phase === "lobby" && (
        <div style={{ border: "1px solid #ccc", padding: 20, borderRadius: 10, maxWidth: 400, margin: "auto" }}>
          <h2>Lobby</h2>
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 8, margin: 5 }}
          />
          <input
            placeholder="Room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            style={{ padding: 8, margin: 5 }}
          />
          <div>
            <button onClick={createRoom} style={{ padding: 10, margin: 5 }}>Create Room</button>
            <button onClick={joinRoom} style={{ padding: 10, margin: 5 }}>Join Room</button>
            {name && creator === name && (
              <button
                onClick={startGame}
                style={{ padding: 10, margin: 5, background: "#4caf50", color: "white", border: "none" }}
              >
                Start Game
              </button>
            )}
          </div>
        </div>
      )}

      {phase === "answer" && (
        <div>
          <h2>Answer Phase</h2>
          <p><strong>Question:</strong> {players[name]?.question}</p>
          <p><strong>Time left:</strong> {timeLeft}s</p>
          <p>Discuss in real life!</p>
        </div>
      )}

      {phase === "debate" && (
        <div>
          <h2>Debate Phase</h2>
          {Object.keys(players).map((p) => (
            <button key={p} onClick={() => vote(p)} style={{ margin: 5, padding: 10 }}>
              Vote {p}
            </button>
          ))}
          <p>Your vote: {players[name]?.vote || "None"}</p>
          <p>Time left: {timeLeft}s</p>
        </div>
      )}

      {phase === "reveal" && (
        <div>
          <h2>Reveal Phase</h2>
          <p><strong>Impostors:</strong> {impostors.join(", ")}</p>
          <h4>Votes:</h4>
          <ul>
            {Object.entries(players).map(([p, data]) => (
              <li key={p}>{p} voted for {data.vote || "Nobody"}</li>
            ))}
          </ul>
          {name === creator && (
            <button onClick={startRound} style={{ padding: 10, marginTop: 10 }}>
              Next Round
            </button>
          )}
        </div>
      )}
    </div>
  );
}

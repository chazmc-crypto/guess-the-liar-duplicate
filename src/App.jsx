return (

  <div style={{ fontFamily: "Arial,sans-serif", padding: 20, maxWidth: 960, margin: "0 auto" }}>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h1>Guess The Liar</h1>
      <div>Room: {roomCode || "—"} | You: {name || "anon"}</div>
    </header>

```
{phase === "lobby" && (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
    <div>
      <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Room" value={roomCode} onChange={e => setRoomCode(e.target.value)} />
      <div>
        <button onClick={createRoom}>Create</button>
        <button onClick={joinRoom}>Join</button>
        {creator === name && <button onClick={startRound}>Start Game</button>}
      </div>
    </div>
    <div>
      <h3>Players</h3>
      {Object.keys(players).map(p => (
        <div key={p}>{p} {p === creator ? "(host)" : ""}</div>
      ))}
    </div>
  </div>
)}

{phase === "answer" && (
  <div>
    <h2>Round {round} - Answer Phase</h2>
    <div>Your question: {players[name]?.variant}</div>
    <input
      type="text"
      value={players[name]?.answer || ""}
      onChange={e => update(ref(database, `rooms/${roomCode}/players/${name}`), { answer: e.target.value })}
      placeholder="Type your answer"
    />
    <div>Time left: {timeLeft}s</div>
  </div>
)}

{phase === "debate" && (
  <div>
    <h2>Debate Phase</h2>
    <div>Real question: {realQuestion}</div>
    <div>
      {Object.keys(players).map(p => (
        <button
          key={p}
          onClick={() => toggleVote(p)}
          style={{ margin: 4, border: selectedVotes.includes(p) ? "2px solid green" : "1px solid #ccc" }}
        >
          {p} {selectedVotes.includes(p) ? "✓" : ""}
        </button>
      ))}
    </div>
    <div>
      <button onClick={submitVote}>Submit Vote</button>
      <span>Time left: {timeLeft}s</span>
    </div>
  </div>
)}

{phase === "reveal" && (
  <div>
    <h2>Reveal Phase</h2>
    <div>Impostors: {impostors.join(", ") || "None"}</div>
    <h3>Votes</h3>
    <ul>
      {Object.entries(players).map(([p, data]) => (
        <li key={p}>{p} voted for {data.vote.join(", ") || "Nobody"}</li>
      ))}
    </ul>
    <h3>Most similar answers:</h3>
    <ul>
      {mostSimilarPairs().map((s, i) => (
        <li key={i}>{s.pair.join(" & ")} — {Math.round(s.score * 100)}%</li>
      ))}
    </ul>
    {creator === name && <button onClick={nextRound}>Next Round</button>}
  </div>
)}
```

  </div>
);

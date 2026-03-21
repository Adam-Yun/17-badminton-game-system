'use client'; // Required in Next.js App Router for files that use React hooks or browser features.

import { useState, useEffect } from 'react';
import { socket, MatchState } from '../src/lib/socket'; 
import styles from './page.module.css';

export default function UmpireDashboard() {

  // Add this line to track connection safely
  const [isConnected, setIsConnected] = useState(false);

  // ==========================================
  // 1. STATE MANAGEMENT (The Single Source of Truth)
  // ==========================================
  // We bundled all individual variables (player names, scores, sets) into one master object.
  // Why? Because it's much easier to send one single JSON object across the WebSocket 
  // than trying to synchronize 5 different state variables at the exact same time.
  const [matchState, setMatchState] = useState<MatchState>({
    status: 'setup', // Dictates which UI screen is currently visible
    currentSet: 1,
    player1: { name: '', country: '', score: 0, setsWon: 0 },
    player2: { name: '', country: '', score: 0, setsWon: 0 },
    matchWinner: null
  });

  // ==========================================
  // 2. LIFECYCLE & NETWORK LISTENER
  // ==========================================
  // useEffect runs side-effects. The empty array [] at the end means:
  // "Only run this setup code exactly once when the page first loads."
  // useEffect(() => {
  //   // 1. Tell the Flask server we are here and want the latest data.
  //   socket.emit('join_match');

  //   // 2. Set up the receiver. Whenever Flask broadcasts 'sync_state', grab that 
  //   // new data and overwrite our React state. This forces the screen to re-render.
  //   socket.on('sync_state', (serverState: MatchState) => {
  //     setMatchState(serverState);
  //   });

  //   // 3. THE CLEANUP FUNCTION
  //   // If the umpire navigates to a different page, this return function runs.
  //   // It unplugs the listener. If we don't do this, every time the page reloads, 
  //   // it creates a duplicate listener, causing memory leaks and double-updates.
  //   return () => {
  //     socket.off('sync_state');
  //   };
  // }, []);

  useEffect(() => {
    // 1. Instantly check if we are already connected
    setIsConnected(socket.connected);

    // 2. Set up listeners to flip the state when the connection changes
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.emit('join_match');
    socket.on('sync_state', (serverState: MatchState) => {
      setMatchState(serverState);
    });

    return () => {
      // 3. Clean up our new listeners so we don't cause memory leaks
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('sync_state');
    };
  }, []);

  // ==========================================
  // 3. THE MASTER UPDATE FUNCTION
  // ==========================================
  // This is our custom helper. Instead of updating React state and forgetting about the server,
  // this function does two things simultaneously to keep everything perfectly synchronized.
  const pushUpdate = (newState: MatchState) => {
    setMatchState(newState); // 1. Update the umpire's screen instantly (Optimistic UI)
    socket.emit('umpire_action', newState); // 2. Send the exact same data to Flask
  };

  // ==========================================
  // 4. GAME LOGIC & EVENT HANDLERS
  // ==========================================

  const startMatch = (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the browser from refreshing when the form submits
    
    // Only proceed if the umpire actually typed names in for both players
    if (matchState.player1.name && matchState.player2.name) {
      // The spread operator (...) copies the existing state, and we just overwrite the 'status'
      pushUpdate({ ...matchState, status: 'playing' });
    }
  };

  const updateScore = (player: 1 | 2, increment: number) => {
    // React Rule: NEVER mutate state directly (e.g., matchState.player1.score = 5 is BAD).
    // Instead, we create a "deep copy" of the current state using JSON.parse and JSON.stringify.
    // This gives us a completely fresh object to safely modify.
    const newState = JSON.parse(JSON.stringify(matchState)) as MatchState;
    
    if (player === 1) {
      // Math.max prevents the score from dropping into negative numbers if the umpire clicks "-" at 0.
      newState.player1.score = Math.max(0, newState.player1.score + increment);
    } else {
      newState.player2.score = Math.max(0, newState.player2.score + increment);
    }
    
    // Send the modified copy to our master update function
    pushUpdate(newState);
  };

  const endSet = () => {
    const newState = JSON.parse(JSON.stringify(matchState)) as MatchState;

    // Determine who won the set based on current points
    if (newState.player1.score > newState.player2.score) {
      newState.player1.setsWon += 1;
    } else if (newState.player2.score > newState.player1.score) {
      newState.player2.setsWon += 1;
    } else {
      alert("Scores are tied! A set cannot end in a tie.");
      return; // Stop the function completely, do not push an update
    }

    // Prepare the state for the next set by wiping points to 0 and advancing the set counter
    newState.player1.score = 0;
    newState.player2.score = 0;
    newState.currentSet += 1;
    
    pushUpdate(newState);
  };

  const endMatch = () => {
    const newState = JSON.parse(JSON.stringify(matchState)) as MatchState;
    
    // Calculate total sets by combining previously won sets with whoever is leading the current unfinished set.
    const p1Total = newState.player1.score > newState.player2.score ? newState.player1.setsWon + 1 : newState.player1.setsWon;
    const p2Total = newState.player2.score > newState.player1.score ? newState.player2.setsWon + 1 : newState.player2.setsWon;
    
    // Assign the winner's name to the matchWinner property and move to the 'ended' screen
    newState.matchWinner = p1Total > p2Total ? newState.player1.name : newState.player2.name;
    newState.status = 'ended';
    
    pushUpdate(newState);
  };

  const resetMatch = () => {
    // Wipe everything back to default factory settings to start a new game
    pushUpdate({
      status: 'setup',
      currentSet: 1,
      player1: { name: '', country: '', score: 0, setsWon: 0 },
      player2: { name: '', country: '', score: 0, setsWon: 0 },
      matchWinner: null
    });
  };

  // ==========================================
  // 5. UI RENDERING
  // ==========================================
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Umpire Control Panel</h1>
        {/* A simple diagnostic tool to show the umpire if they lose their Wi-Fi connection
        <div style={{ fontSize: '12px', color: socket.connected ? 'green' : 'red' }}>
          {socket.connected ? '🟢 Connected to Server' : '🔴 Disconnected'}
        </div> */}
        {/* Replace socket.connected with isConnected */}
        <div style={{ fontSize: '12px', color: isConnected ? 'green' : 'red' }}>
          {isConnected ? '🟢 Connected to Server' : '🔴 Disconnected'}
        </div>
      </header>

      {/* PHASE 1: SETUP */}
      {/* The && acts like an IF statement. If status === 'setup', render the form. */}
      {matchState.status === 'setup' && (
        <form onSubmit={startMatch} className={styles.setupForm}>
          {/* Form inputs are "controlled components". Their value is tied directly to the state, 
              and onChange updates that state on every single keystroke. */}
          <div className={styles.playerInput}>
            <h2>Player 1</h2>
            <input 
              type="text" placeholder="Name" required 
              value={matchState.player1.name} 
              onChange={(e) => pushUpdate({ ...matchState, player1: { ...matchState.player1, name: e.target.value } })} 
            />
            <input 
              type="text" placeholder="Country (e.g., AUS)" required maxLength={3}
              value={matchState.player1.country} 
              onChange={(e) => pushUpdate({ ...matchState, player1: { ...matchState.player1, country: e.target.value.toUpperCase() } })} 
            />
          </div>

          <div className={styles.playerInput}>
            <h2>Player 2</h2>
            <input 
              type="text" placeholder="Name" required 
              value={matchState.player2.name} 
              onChange={(e) => pushUpdate({ ...matchState, player2: { ...matchState.player2, name: e.target.value } })} 
            />
            <input 
              type="text" placeholder="Country (e.g., MAS)" required maxLength={3}
              value={matchState.player2.country} 
              onChange={(e) => pushUpdate({ ...matchState, player2: { ...matchState.player2, country: e.target.value.toUpperCase() } })} 
            />
          </div>

          <button type="submit" className={styles.primaryButton}>Start Match</button>
        </form>
      )}

      {/* PHASE 2: PLAYING */}
      {matchState.status === 'playing' && (
        <div className={styles.scoreboard}>
          <div className={styles.matchInfo}>
            <h2>Set {matchState.currentSet}</h2>
          </div>

          <div className={styles.scoreContainer}>
            <div className={styles.playerCard}>
              <div className={styles.playerMeta}>
                <h3>{matchState.player1.name}</h3>
                <span className={styles.country}>{matchState.player1.country}</span>
                <span className={styles.sets}>Sets Won: {matchState.player1.setsWon}</span>
              </div>
              <div className={styles.score}>{matchState.player1.score}</div>
              <div className={styles.controls}>
                {/* Wrapped in arrow functions () => so they don't fire automatically when the page loads */}
                <button type="button" onClick={() => updateScore(1, -1)} className={styles.minusBtn}>-</button>
                <button type="button" onClick={() => updateScore(1, 1)} className={styles.plusBtn}>+</button>
              </div>
            </div>

            <div className={styles.divider}>VS</div>

            <div className={styles.playerCard}>
              <div className={styles.playerMeta}>
                <h3>{matchState.player2.name}</h3>
                <span className={styles.country}>{matchState.player2.country}</span>
                <span className={styles.sets}>Sets Won: {matchState.player2.setsWon}</span>
              </div>
              <div className={styles.score}>{matchState.player2.score}</div>
              <div className={styles.controls}>
                <button type="button" onClick={() => updateScore(2, -1)} className={styles.minusBtn}>-</button>
                <button type="button" onClick={() => updateScore(2, 1)} className={styles.plusBtn}>+</button>
              </div>
            </div>
          </div>

          <div className={styles.matchActions}>
            <button type="button" onClick={endSet} className={styles.secondaryButton}>End Set</button>
            <button type="button" onClick={endMatch} className={styles.dangerButton}>End Match</button>
          </div>
        </div>
      )}

      {/* PHASE 3: ENDED */}
      {matchState.status === 'ended' && (
        <div className={styles.resultScreen}>
          <h2>Match Ended</h2>
          <p>Winner: <strong>{matchState.matchWinner}</strong></p>
          <button type="button" onClick={resetMatch} className={styles.primaryButton}>Start New Match</button>
        </div>
      )}
    </div>
  );
}
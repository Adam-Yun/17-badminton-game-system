// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { socket, MatchState } from '../src/lib/socket';
import styles from './page.module.css';

export default function SpectatorDashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [matchState, setMatchState] = useState<MatchState | null>(null);

  useEffect(() => {
    setIsConnected(socket.connected);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.emit('join_match');

    socket.on('sync_state', (serverState: MatchState) => {
      setMatchState(serverState);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('sync_state');
    };
  }, []);

  if (!matchState) {
    return (
      <div className={styles.loadingContainer}>
        <h1>Waiting for match data...</h1>
        <p style={{ color: isConnected ? '#28a745' : '#dc3545' }}>
          {isConnected ? 'Connected to server. Waiting for Umpire.' : 'Connecting to server...'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.statusBadge} style={{ backgroundColor: isConnected ? '#28a745' : '#dc3545' }}>
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </div>
        <h2 className={styles.setIndicator}>
          {matchState.status === 'ended' ? 'Match Ended' : `Set ${matchState.currentSet}`}
        </h2>
      </header>

      <main className={styles.scoreboard}>
        <div className={styles.playerColumn}>
          <div className={styles.playerInfo}>
            <h1 className={styles.playerName}>{matchState.player1.name || 'Player 1'}</h1>
            <span className={styles.playerCountry}>{matchState.player1.country || '---'}</span>
            <div className={styles.setsWon}>Sets: {matchState.player1.setsWon}</div>
          </div>
          <div className={styles.hugeScore}>{matchState.player1.score}</div>
        </div>

        <div className={styles.centerDivider}>
          <div className={styles.vs}>VS</div>
        </div>

        <div className={styles.playerColumn}>
          <div className={styles.playerInfo}>
            <h1 className={styles.playerName}>{matchState.player2.name || 'Player 2'}</h1>
            <span className={styles.playerCountry}>{matchState.player2.country || '---'}</span>
            <div className={styles.setsWon}>Sets: {matchState.player2.setsWon}</div>
          </div>
          <div className={styles.hugeScore}>{matchState.player2.score}</div>
        </div>
      </main>

      {matchState.status === 'ended' && (
        <div className={styles.winnerOverlay}>
          <h1>🏆 {matchState.matchWinner} Wins! 🏆</h1>
        </div>
      )}
    </div>
  );
}

// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the page.tsx file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }

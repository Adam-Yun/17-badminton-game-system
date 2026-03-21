// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

export interface MatchState {
  status: 'setup' | 'playing' | 'ended';
  currentSet: number;
  player1: { name: string; country: string; score: number; setsWon: number };
  player2: { name: string; country: string; score: number; setsWon: number };
  matchWinner: string | null;
}

// Point this directly to the machine running your Flask backend
const SOCKET_URL = 'http://127.0.0.1:5000';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
});
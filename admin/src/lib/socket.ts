// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

// Define the exact structure of our match state so TypeScript can catch errors
export interface MatchState {
  status: 'setup' | 'playing' | 'ended';
  currentSet: number;
  player1: { name: string; country: string; score: number; setsWon: number };
  player2: { name: string; country: string; score: number; setsWon: number };
  matchWinner: string | null;
}

// Connect to the Flask server. 
// Change 'localhost' to your server's IP (like 10.136.12.196) if running on different machines.
const SOCKET_URL = 'http://127.0.0.1:5000';

// Export a single, persistent socket connection
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
});
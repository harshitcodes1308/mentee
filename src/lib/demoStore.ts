// ─── Local State Store (Demo Mode) ───────────────────────────────────────────
// BroadcastChannel keeps two tabs (host + player) in sync.
// localStorage persists room/players/answers across tab refreshes.

import type { Room, Player, Answer } from '../types';
import { QUESTIONS } from '../data/questions';

export interface GameState {
  room: Room | null;
  players: Player[];
  answers: Answer[][];
}

// ─── Broadcast channel ────────────────────────────────────────────────────────
const CHANNEL_NAME = 'hackshastra-quiz';

type DemoEvent =
  | { type: 'PLAYER_JOINED';   player: Player }
  | { type: 'ROOM_UPDATED';    room: Room }
  | { type: 'ANSWER_SUBMITTED'; questionIndex: number; answer: Answer }
  | { type: 'PLAYER_UPDATED';  player: Player };

let _channel: BroadcastChannel | null = null;
const _listeners: Array<(e: DemoEvent) => void> = [];

export function getDemoChannel(): BroadcastChannel {
  if (!_channel) {
    _channel = new BroadcastChannel(CHANNEL_NAME);
    _channel.onmessage = (e) => _listeners.forEach((fn) => fn(e.data as DemoEvent));
  }
  return _channel;
}

export function onDemoEvent(fn: (e: DemoEvent) => void): () => void {
  _listeners.push(fn);
  return () => { const i = _listeners.indexOf(fn); if (i > -1) _listeners.splice(i, 1); };
}

export function broadcastDemoEvent(event: DemoEvent) {
  getDemoChannel().postMessage(event);
  _listeners.forEach((fn) => fn(event));
}

// ─── Persistence ──────────────────────────────────────────────────────────────
const ROOM_KEY    = 'hs_room';
const PLAYERS_KEY = 'hs_players';
const ANSWERS_KEY = 'hs_answers';

export const saveRoom    = (r: Room)       => localStorage.setItem(ROOM_KEY, JSON.stringify(r));
export const loadRoom    = (): Room | null  => { try { return JSON.parse(localStorage.getItem(ROOM_KEY) || 'null'); } catch { return null; } };
export const savePlayers = (p: Player[])   => localStorage.setItem(PLAYERS_KEY, JSON.stringify(p));
export const loadPlayers = (): Player[]    => { try { return JSON.parse(localStorage.getItem(PLAYERS_KEY) || '[]'); } catch { return []; } };
export const saveAnswers = (a: Answer[][]) => localStorage.setItem(ANSWERS_KEY, JSON.stringify(a));
export const loadAnswers = (): Answer[][]  => { try { return JSON.parse(localStorage.getItem(ANSWERS_KEY) || 'null') ?? Array(QUESTIONS.length).fill([]).map(() => []); } catch { return Array(QUESTIONS.length).fill([]).map(() => []); } };

export function clearGameState() {
  localStorage.removeItem(ROOM_KEY);
  localStorage.removeItem(PLAYERS_KEY);
  localStorage.removeItem(ANSWERS_KEY);
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
export function calculatePoints(correct: boolean): number {
  return correct ? 100 : -50;
}

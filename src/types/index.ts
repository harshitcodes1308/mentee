// ─── Core Data Types ────────────────────────────────────────────────────────

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  currentQuestionIndex: number;
  startedAt: string | null;
  questionStartedAt: string | null;
  hostId: string;
}

export interface Player {
  tempId: string;
  roomId: string;
  nickname: string;
  avatarSeed: string;
  joinedAt: string;
  score: number;
  streak: number;
  bestStreak: number;
  correctAnswers: number;
  totalTimeMs: number;
}

export interface Question {
  id: number;
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
  difficulty: 'easy' | 'medium';
  category: string;
}

export interface Answer {
  playerId: string;
  questionId: number;
  selectedIndex: number;
  timeTakenMs: number;
  pointsAwarded: number;
}

// ─── App State Types ─────────────────────────────────────────────────────────

export type AppView = 'home' | 'host' | 'player';

export interface PlayerState {
  tempId: string;
  roomId: string;
  roomCode: string;
  nickname: string;
  avatarSeed: string;
  score: number;
  streak: number;
  bestStreak: number;
  correctAnswers: number;
  totalTimeMs: number;
}

export interface QuizResult {
  rank: number;
  score: number;
  correct: number;
  bestStreak: number;
  totalPlayers: number;
}

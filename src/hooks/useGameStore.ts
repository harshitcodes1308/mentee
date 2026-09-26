// ─── useGameStore — mode-switching façade ────────────────────────────────────
// VITE_USE_DB=true  → production mode: API calls + Neon polling
// (default)          → demo mode: BroadcastChannel (two tabs, no backend)

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Room, Player, Answer } from '../types';
import { QUESTIONS, QUESTION_TIME_SEC } from '../data/questions';
import {
  loadRoom, loadPlayers, saveRoom, savePlayers, saveAnswers,
  broadcastDemoEvent, onDemoEvent, clearGameState, calculatePoints,
} from '../lib/demoStore';
import { generateRoomCode, generateTempId } from '../lib/utils';
import { useApiHostGame, useApiPlayerGame } from './useApiGame';

const USE_DB = import.meta.env.VITE_USE_DB === 'true';

// ─── Public API — same interface regardless of mode ───────────────────────────

export function useHostGame() {
  if (USE_DB) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiHostGame();
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useDemoHostGame();
}

export function usePlayerGame(roomCode: string, tempId: string) {
  if (USE_DB) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApiPlayerGame(roomCode, tempId);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useDemoPlayerGame(roomCode, tempId);
}

// ─── Demo host ────────────────────────────────────────────────────────────────
function useDemoHostGame() {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answers, setAnswers] = useState<Answer[][]>(
    Array(QUESTIONS.length).fill(null).map(() => []),
  );
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SEC);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createRoom = useCallback(() => {
    clearGameState();
    const hostId = generateTempId();
    const newRoom: Room = {
      id: generateTempId(),
      code: generateRoomCode(),
      status: 'waiting',
      currentQuestionIndex: 0,
      startedAt: null,
      questionStartedAt: null,
      hostId,
    };
    saveRoom(newRoom);
    savePlayers([]);
    saveAnswers(Array(QUESTIONS.length).fill(null).map(() => []));
    setRoom(newRoom);
    setPlayers([]);
    setAnswers(Array(QUESTIONS.length).fill(null).map(() => []));
    broadcastDemoEvent({ type: 'ROOM_UPDATED', room: newRoom });
  }, []);

  useEffect(() => {
    const unsub = onDemoEvent((event) => {
      if (event.type === 'PLAYER_JOINED') {
        setPlayers((prev) => {
          if (prev.find((p) => p.tempId === event.player.tempId)) return prev;
          const updated = [...prev, event.player];
          savePlayers(updated);
          return updated;
        });
      }
      if (event.type === 'ANSWER_SUBMITTED') {
        setAnswers((prev) => {
          const updated = prev.map((arr, i) =>
            i === event.questionIndex ? [...arr, event.answer] : arr,
          );
          saveAnswers(updated);
          return updated;
        });
        setPlayers((prev) => {
          const updated = prev.map((p) => {
            if (p.tempId !== event.answer.playerId) return p;
            const correct = event.answer.pointsAwarded > 0;
            const newStreak = correct ? p.streak + 1 : 0;
            const updatedPlayer: Player = {
              ...p,
              score: p.score + event.answer.pointsAwarded,
              streak: newStreak,
              bestStreak: Math.max(p.bestStreak, newStreak),
              correctAnswers: p.correctAnswers + (correct ? 1 : 0),
              totalTimeMs: p.totalTimeMs + event.answer.timeTakenMs,
            };
            broadcastDemoEvent({ type: 'PLAYER_UPDATED', player: updatedPlayer });
            return updatedPlayer;
          });
          savePlayers(updated);
          return updated;
        });
      }
    });
    return unsub;
  }, []);

  const startTimer = useCallback((startedAt: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, QUESTION_TIME_SEC - (Date.now() - new Date(startedAt).getTime()) / 1000);
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timerRef.current!);
    }, 100);
  }, []);

  const startQuiz = useCallback(() => {
    if (!room) return;
    const now = new Date().toISOString();
    const updated: Room = { ...room, status: 'playing', startedAt: now, currentQuestionIndex: 0, questionStartedAt: now };
    saveRoom(updated); setRoom(updated); setTimeLeft(QUESTION_TIME_SEC);
    startTimer(now);
    broadcastDemoEvent({ type: 'ROOM_UPDATED', room: updated });
  }, [room, startTimer]);

  const nextQuestion = useCallback(() => {
    if (!room) return;
    const nextIdx = room.currentQuestionIndex + 1;
    if (nextIdx >= QUESTIONS.length) {
      const updated: Room = { ...room, status: 'finished', questionStartedAt: null };
      saveRoom(updated); setRoom(updated);
      if (timerRef.current) clearInterval(timerRef.current);
      broadcastDemoEvent({ type: 'ROOM_UPDATED', room: updated });
    } else {
      const now = new Date().toISOString();
      const updated: Room = { ...room, currentQuestionIndex: nextIdx, questionStartedAt: now };
      saveRoom(updated); setRoom(updated); setTimeLeft(QUESTION_TIME_SEC);
      startTimer(now);
      broadcastDemoEvent({ type: 'ROOM_UPDATED', room: updated });
    }
  }, [room, startTimer]);

  // Auto-advance after timer hits 0
  useEffect(() => {
    if (timeLeft <= 0 && room?.status === 'playing') {
      const t = setTimeout(() => nextQuestion(), 2000);
      return () => clearTimeout(t);
    }
  }, [timeLeft, room?.status, nextQuestion]);

  const leaderboard = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
    return a.totalTimeMs - b.totalTimeMs;
  });

  return { room, players, leaderboard, answers, timeLeft, createRoom, startQuiz, nextQuestion, kickPlayer: (_: string) => {} };
}

// ─── Demo player ──────────────────────────────────────────────────────────────
function useDemoPlayerGame(roomCode: string, tempId: string) {
  const [room, setRoom] = useState<Room | null>(() => {
    const r = loadRoom(); return r?.code === roomCode ? r : null;
  });
  const [players, setPlayers] = useState<Player[]>(loadPlayers);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SEC);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{ correct: boolean; points: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentQRef = useRef(-1);
  const myPlayerRef = useRef<Player | null>(null);

  useEffect(() => {
    const r = loadRoom();
    if (r?.code === roomCode) setRoom(r);
    const unsub = onDemoEvent((event) => {
      if (event.type === 'ROOM_UPDATED' && event.room.code === roomCode) {
        setRoom(event.room);
        if (event.room.currentQuestionIndex !== currentQRef.current) {
          currentQRef.current = event.room.currentQuestionIndex;
          setHasAnswered(false); setLastAnswer(null);
          if (event.room.questionStartedAt) startTimer(event.room.questionStartedAt);
        }
      }
      if (event.type === 'PLAYER_UPDATED' && event.player.tempId === tempId) {
        myPlayerRef.current = event.player;
        setPlayers((prev) => prev.map((p) => p.tempId === tempId ? event.player : p));
      }
      if (event.type === 'PLAYER_JOINED') {
        setPlayers((prev) => prev.find((p) => p.tempId === event.player.tempId) ? prev : [...prev, event.player]);
      }
    });
    return unsub;
  }, [roomCode, tempId]);

  useEffect(() => {
    if (room?.status === 'playing' && room.questionStartedAt) startTimer(room.questionStartedAt);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [room?.questionStartedAt]);

  function startTimer(startedAt: string) {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, QUESTION_TIME_SEC - (Date.now() - new Date(startedAt).getTime()) / 1000);
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timerRef.current!);
    }, 100);
  }

  const submitAnswer = useCallback((selectedIndex: number) => {
    if (hasAnswered || !room) return;
    const myPlayer = myPlayerRef.current || loadPlayers().find((p) => p.tempId === tempId);
    if (!room.questionStartedAt || !myPlayer) return;
    const timeTakenMs = Date.now() - new Date(room.questionStartedAt).getTime();
    const question = QUESTIONS[room.currentQuestionIndex];
    const correct = selectedIndex === question.correctIndex;
    const points = calculatePoints(correct, timeTakenMs, myPlayer.streak);
    setHasAnswered(true);
    setLastAnswer({ correct, points });
    broadcastDemoEvent({
      type: 'ANSWER_SUBMITTED',
      questionIndex: room.currentQuestionIndex,
      answer: { playerId: tempId, questionId: question.id, selectedIndex, timeTakenMs, pointsAwarded: points },
    });
  }, [hasAnswered, room, tempId]);

  const joinGame = useCallback(async (nickname: string): Promise<{ ok: boolean; player?: Player; error?: string }> => {
    const r = loadRoom();
    if (!r || r.code !== roomCode) {
      return { ok: false, error: 'Room not found — make sure the host tab is open and the code is correct.' };
    }
    const id = tempId || generateTempId();
    const player: Player = {
      tempId: id,
      roomId: r.id,
      nickname: nickname.trim() || `Hacker ${id.slice(-4)}`,
      avatarSeed: id,
      joinedAt: new Date().toISOString(),
      score: 0,
      streak: 0,
      bestStreak: 0,
      correctAnswers: 0,
      totalTimeMs: 0,
    };
    const all = [...loadPlayers().filter((p) => p.tempId !== id), player];
    savePlayers(all);
    broadcastDemoEvent({ type: 'PLAYER_JOINED', player });
    return { ok: true, player };
  }, [roomCode, tempId]);

  return { room, players, timeLeft, hasAnswered, lastAnswer, submitAnswer, joinGame };
}

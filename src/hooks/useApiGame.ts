// ─── API-backed game hooks (production mode with Neon) ───────────────────────
// Used when VITE_USE_DB=true. All state lives in Neon; frontend polls every 500ms.

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Room, Player } from '../types';
import { QUESTION_TIME_SEC } from '../data/questions';
import { generateTempId } from '../lib/utils';

const BASE = '/api';

async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || r.statusText);
  }
  return r.json();
}

// ─── useApiHostGame ────────────────────────────────────────────────────────────
export function useApiHostGame() {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SEC);
  const hostIdRef = useRef<string>('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Create room ────────────────────────────────────────────────────────────
  const createRoom = useCallback(async () => {
    const data = await apiFetch('/room-create', { method: 'POST' });
    hostIdRef.current = data.hostId;
    const r = data.room;
    setRoom({
      id: r.id, code: r.code, status: r.status ?? 'waiting',
      currentQuestionIndex: r.current_question_index ?? 0,
      startedAt: r.started_at ?? null,
      questionStartedAt: r.question_started_at ?? null,
      hostId: data.hostId,
    });
    return data;
  }, []);

  // ─── Poll room state ────────────────────────────────────────────────────────
  const poll = useCallback(async (code: string) => {
    try {
      const data = await apiFetch(`/room-state?code=${code}`);
      setRoom(data.room);
      setPlayers(data.players);

      if (data.room.questionStartedAt) {
        const elapsed = (Date.now() - new Date(data.room.questionStartedAt).getTime()) / 1000;
        setTimeLeft(Math.max(0, QUESTION_TIME_SEC - elapsed));
      }
    } catch { /* network hiccup — silently skip */ }
  }, []);

  // Start polling once we have a room code
  useEffect(() => {
    if (!room?.code) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => poll(room.code), 500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [room?.code, poll]);

  // Local countdown derived from server timestamp
  useEffect(() => {
    if (!room?.questionStartedAt || room.status !== 'playing') return;
    if (timerRef.current) clearInterval(timerRef.current);
    const startedAt = room.questionStartedAt;
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
      setTimeLeft(Math.max(0, QUESTION_TIME_SEC - elapsed));
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [room?.questionStartedAt, room?.status]);

  // ─── Auto-advance after timer hits 0 ────────────────────────────────────────
  const nextRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timeLeft <= 0 && room?.status === 'playing') {
      if (nextRef.current) return; // already scheduled
      nextRef.current = setTimeout(async () => {
        try {
          await apiFetch('/room-next', {
            method: 'POST',
            body: JSON.stringify({ code: room.code, hostId: hostIdRef.current }),
          });
        } catch { /* not host — ignore */ }
        nextRef.current = null;
      }, 2000);
    } else {
      if (nextRef.current) { clearTimeout(nextRef.current); nextRef.current = null; }
    }
  }, [timeLeft, room?.status, room?.code]);

  // ─── Actions ────────────────────────────────────────────────────────────────
  const startQuiz = useCallback(async () => {
    if (!room) return;
    await apiFetch('/room-start', {
      method: 'POST',
      body: JSON.stringify({ code: room.code, hostId: hostIdRef.current }),
    });
  }, [room]);

  const nextQuestion = useCallback(async () => {
    if (!room) return;
    await apiFetch('/room-next', {
      method: 'POST',
      body: JSON.stringify({ code: room.code, hostId: hostIdRef.current }),
    });
  }, [room]);

  const leaderboard = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
    return a.totalTimeMs - b.totalTimeMs;
  });

  return { room, players, leaderboard, timeLeft, createRoom, startQuiz, nextQuestion };
}

// ─── useApiPlayerGame ──────────────────────────────────────────────────────────
export function useApiPlayerGame(roomCode: string, tempId: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SEC);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{ correct: boolean; points: number } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevQRef = useRef(-1);

  // ─── Poll ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomCode) return;

    async function poll() {
      try {
        const data = await apiFetch(`/room-state?code=${roomCode}`);
        setRoom(data.room);
        setPlayers(data.players);

        // New question — reset answered state
        if (data.room.currentQuestionIndex !== prevQRef.current) {
          prevQRef.current = data.room.currentQuestionIndex;
          setHasAnswered(false);
          setLastAnswer(null);
        }
      } catch { /* skip */ }
    }

    poll();
    pollRef.current = setInterval(poll, 500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [roomCode]);

  // ─── Local countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!room?.questionStartedAt || room.status !== 'playing') return;
    if (timerRef.current) clearInterval(timerRef.current);
    const startedAt = room.questionStartedAt;
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
      setTimeLeft(Math.max(0, QUESTION_TIME_SEC - elapsed));
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [room?.questionStartedAt, room?.status]);

  // ─── Submit answer ───────────────────────────────────────────────────────────
  const submitAnswer = useCallback(async (selectedIndex: number) => {
    if (hasAnswered || !room || !tempId) return;
    setHasAnswered(true);

    try {
      const { correct, points } = await apiFetch('/room-answer', {
        method: 'POST',
        body: JSON.stringify({
          code: roomCode,
          tempId,
          questionId: room.currentQuestionIndex + 1,
          selectedIndex,
        }),
      });
      setLastAnswer({ correct, points });
    } catch (e) {
      console.error('answer submit failed:', e);
    }
  }, [hasAnswered, room, tempId, roomCode]);

  // ─── Join game ─────────────────────────────────────────────────────────────
  const joinGame = useCallback(async (nickname: string): Promise<{ ok: boolean; player?: Player; error?: string }> => {
    try {
      const id = tempId || generateTempId();
      const res = await apiFetch('/room-join', {
        method: 'POST',
        body: JSON.stringify({
          code: roomCode,
          tempId: id,
          nickname: nickname.trim() || `Hacker ${id.slice(-4)}`,
          avatarSeed: id,
        }),
      });
      const player: Player = {
        tempId: id,
        roomId: res.roomId,
        nickname: nickname.trim() || `Hacker ${id.slice(-4)}`,
        avatarSeed: id,
        joinedAt: new Date().toISOString(),
        score: 0,
        streak: 0,
        bestStreak: 0,
        correctAnswers: 0,
        totalTimeMs: 0,
      };
      return { ok: true, player };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join room';
      return { ok: false, error: msg };
    }
  }, [roomCode, tempId]);

  return { room, players, timeLeft, hasAnswered, lastAnswer, submitAnswer, joinGame };
}

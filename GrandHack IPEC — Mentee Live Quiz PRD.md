# GrandHack IPEC — Mentee Live Quiz PRD

Sep 26, 2026 · @harshit

## Overview

GrandHack IPEC needs a live, phone-based quiz that turns mentee waiting time into a group moment. Students scan one QR code on the big screen, instantly get a temp ID and an animated avatar, then answer 20 easy-to-medium coding and hackathon MCQs on their own phone while a synced countdown and leaderboard play out on the big screen.

One-line pitch: a Kahoot-style live quiz, except the QR screen itself comes alive with everyone's avatar the moment they join.

## Goals and success metrics

Goals:

- Zero friction to join: no app install, no login, no typing beyond an optional nickname
- Make joining itself feel like an event, not a loading screen
- Keep 100+ phones in sync within a second so nobody feels cheated by lag

| Metric | Target |
| --- | --- |
| Scan to first question answered | Under 20 seconds |
| Join rate vs people who see the QR | 70%+ |
| Quiz completion rate (joined vs finished all 20) | 85%+ |
| Perceived lag between question push and display | Under 500ms |

## End-to-end user flow

1. Big screen shows a QR code with the room code underneath
2. Student scans with their phone camera, no app needed, a web page opens
3. The page issues a temp ID and auto-generates an animated avatar, no form beyond an optional nickname
4. That avatar animates onto the big screen instantly, joining a growing wall of avatars around the QR code
5. Once the host starts, the phone flips into the answer screen: question text plus 4 colored buttons
6. Each question runs for 15 seconds, then auto-advances for everyone at the same moment
7. After 20 questions, the big screen runs a countdown reveal of the final leaderboard, top 3 get a podium animation
8. The phone shows a personal result card: rank, score, streak, with a share button

## Core features by screen

Big screen (host display):

- QR code and room code, visible until the quiz starts
- Live avatar wall that fills up as people join, with a running join counter
- Question broadcast in sync with phones, big countdown ring
- Optional mid-quiz mini-leaderboard flash
- Final leaderboard reveal with a podium animation for the top 3

Phone (player):

- Instant join page, temp ID issued automatically
- Auto-generated animated avatar, nickname optional
- Waiting room with a live "X people joined" count
- Answer screen: 4 large tap targets, countdown bar, streak indicator
- Personal result card at the end with a shareable image

Host controls:

- Start / pause / skip the quiz
- Kick a player
- Swap or edit the question bank
- Live stats view (join count, answer distribution per question)

## Quiz engine rules

- 20 questions total, easy-to-medium difficulty, coding concepts and hackathon trivia, no code to write or run, just multiple choice with 4 options
- 15 seconds per question, counted from the moment the server pushes it, not from when a phone renders it, so a slow phone gets no extra time
- Score per question: a base value for a correct answer plus a speed bonus, so answering fast is worth more, similar to Kahoot's decaying-points model
- A small streak bonus for consecutive correct answers
- No answer within 15 seconds counts as zero for that question
- Tie-break order: total correct answers first, then total time spent across the quiz, fastest wins
- The server, not any single phone, is the source of truth for the current question and the clock, so a network hiccup on one phone can't desync the room

## QR join and the live avatar wall

This is the part that should make the room feel alive before the quiz even starts.

- Scanning the QR opens a lightweight web page instantly, no install
- A temp ID (short code plus a session token) is issued right away and saved on the phone, so a refresh doesn't lose their spot
- An animated avatar generates automatically, seeded from the temp ID, so it's unique to them without a sign-up form
- The moment a phone joins, that same avatar animates onto the big screen, popping in or floating into an avatar cloud around the QR code
- The big screen keeps a running counter, "X hackers in the room," and the avatar cloud visibly grows, which doubles as social proof pulling more people to scan
- New joins are batched slightly once the crowd gets big, so the animation stays smooth instead of stuttering

## Leaderboard and results

- An optional mini-leaderboard can flash on the big screen every few questions, to keep tension without giving away full standings too early
- The final reveal counts down from a lower rank to first place, each name pulled up with their avatar, with a distinct podium animation and confetti for the top 3
- Each phone gets a personal result card: final rank, score, correct answers out of 20, and best streak
- That card has a share button that generates a downloadable image, so players can post it or send it in their hackathon group chat, which doubles as marketing for the activity

## Visual and UI direction

Typography: a bold, rounded display font for headings and big numbers, e.g. Clash Display, Cabinet Grotesk, or Poppins Extrabold, paired with a clean geometric sans like Inter or Satoshi for body text and answer options.

Color and mood: a dark, high-contrast base (deep navy or near-black) with two or three neon accents for the four answer buttons, so the screen reads as an arcade or party, not a form.

Motion, the difference between "a quiz app" and "the moment everyone remembers":

- Buttons bounce on tap, wrong answers get a quick shake and red flash, correct ones get a green flash and a small burst
- The countdown ring shifts color as time runs out, green to amber to red, with a subtle pulse in the last 3 seconds
- Avatars idle-bob on the wall instead of sitting still, so it never looks frozen
- Big screen and phone share the same visual language, so nobody feels like they're on two different products

Practical constraints: big-screen text legible from the back of a hall, thumb-sized phone buttons for one-handed tapping, and everything still looks good on a mid-range Android phone on venue wifi.

## Tech stack and architecture

Given the hackathon build clock, favor tools that remove backend work rather than a fully custom server.

- Frontend (phone client and host display): React with Vite or Next.js, Tailwind CSS for styling, Framer Motion for the animations above
- Realtime sync: Supabase Realtime or Firebase Realtime Database for room state, joins, question push, and answer collection, both have generous free tiers and need almost no backend code
- QR code: generated client-side with a library like qrcode.react, pointing to a URL that encodes the room code
- Avatars: DiceBear's avatar API, seeded with each player's temp ID, so every avatar is free, unique, and instant with no asset design work
- Timing authority: the server (or a serverless function) stamps each question's start time, every client computes its own local countdown from that timestamp, so a laggy connection doesn't desync the room
- Hosting: Vercel for the frontend, Supabase or Firebase for the realtime layer, both deployable well within a hackathon timeframe

## Data model

| Entity | Key fields |
| --- | --- |
| Room | id, code, status, currentQuestionIndex, startedAt |
| Player | tempId, roomId, nickname, avatarSeed, joinedAt, score, streak |
| Question | id, text, options (4), correctIndex, difficulty |
| Answer | playerId, questionId, selectedIndex, timeTakenMs, pointsAwarded |

## Non-functional requirements

- Handle at least 150-300 concurrent phones on shared venue wifi without visible desync
- Question broadcast to every client within roughly 300ms of the host trigger
- A phone that loses connection mid-quiz reconnects via its temp ID and resumes at the correct question, no restart
- No login, no app install, everything runs in the phone's browser
- Keep payloads small, avatars and question text only, so a weak signal doesn't stall the join or answer flow
- Stays usable on an older or low-end Android phone, the common device at most college hackathons

## Hackathon build plan

Ship in this order, cut from the bottom if time runs short.

Must ship (P0): QR join with temp ID, synced 20-question quiz with 15-second timer and 4 options, scoring, final leaderboard. High value (P1): animated avatar on join, avatar wall on the big screen, speed-based scoring, top-3 podium animation. Nice to have (P2): shareable result card, sound effects, streak bonus, mid-quiz mini-leaderboard, live join counter animation.

| Hours | Focus |
| --- | --- |
| 0-4 | Room and session backend, realtime channel, QR join flow |
| 4-10 | Quiz flow, server-timed 15s countdown, scoring logic |
| 10-16 | Visual pass: fonts, colors, button and timer animations |
| 16-20 | Avatar generation and the avatar wall |
| 20-26 | Leaderboard reveal animation and result card |
| 26-30 | Multi-device testing on real wifi, bug fixes |
| 30+ | Buffer and demo rehearsal |

## Ready-to-paste AI build prompt

Paste this into Claude Code or a similar AI coding tool to scaffold the whole thing in one pass.

```markdown
Build a live, phone-based quiz web app for a hackathon mentee session, in React + Vite + Tailwind + Framer Motion, with Supabase (or Firebase) Realtime for sync.

Two screens:
1. HOST screen (big display): shows a QR code + room code before start. As phones join, a "temp ID" is issued to each and an animated avatar (via DiceBear API, seeded by temp ID) pops onto the screen and floats into a growing avatar wall around the QR code, with a live "X joined" counter. Host has Start / Pause / Skip / Kick controls. During the quiz, shows the current question, a countdown ring (green to amber to red over 15s), and after the last question, an animated countdown leaderboard reveal ending in a podium animation with confetti for the top 3.

2. PLAYER screen (phone, opened by scanning the QR, no login, no install): issues a temp ID + avatar instantly. Waiting room shows join confirmation. During the quiz: question text + 4 large colorful tap options, a 15-second countdown bar synced to server time, correct/wrong flash feedback, streak indicator. At the end: a personal result card (rank, score, correct/20, best streak) with a share button that exports the card as an image.

Quiz logic: 20 multiple-choice questions, easy-to-medium difficulty, coding concepts and hackathon trivia, no code writing or execution required. The server is the timing authority: it stamps each question's start time, all clients compute their own countdown from that timestamp so network lag never desyncs the room. Scoring: base points for a correct answer, a speed bonus for answering faster, a small streak bonus for consecutive correct answers, zero for no answer within 15 seconds. Tie-break: most correct answers, then fastest total time.

Design language: dark, high-contrast background, bold rounded display font for headings and numbers (e.g. Poppins Extrabold or Clash Display), clean sans for body text (Inter), vibrant neon accent colors for the four answer buttons, thumb-sized tap targets, micro-interactions on every action (button bounce, shake on wrong, flash on correct, idle-bob animation on avatars).

Data model: Room (id, code, status, currentQuestionIndex, startedAt), Player (tempId, roomId, nickname, avatarSeed, joinedAt, score, streak), Question (id, text, options[4], correctIndex, difficulty), Answer (playerId, questionId, selectedIndex, timeTakenMs, pointsAwarded).

Build the P0 slice first (join with temp ID, synced 20-question quiz, scoring, final leaderboard) fully working end to end before adding the avatar wall, podium animation, and share card.
```

// ─── App Root ─────────────────────────────────────────────────────────────────
// Routes between Home, Host, and Player views based on URL params.

import { useState, useEffect } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { HostScreen } from './screens/HostScreen';
import { PlayerScreen } from './screens/PlayerScreen';

type View = 'home' | 'host' | 'player';

function getInitialView(): { view: View; roomCode?: string } {
  const params = new URLSearchParams(window.location.search);
  const join = params.get('join');
  const host = params.get('host');
  if (join) return { view: 'player', roomCode: join };
  if (host !== null) return { view: 'host' };
  return { view: 'home' };
}

export default function App() {
  const [{ view, roomCode }, setState] = useState(getInitialView);

  // Sync URL when view changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.search = '';
    if (view === 'host') url.searchParams.set('host', '');
    if (view === 'player' && roomCode) url.searchParams.set('join', roomCode);
    window.history.replaceState({}, '', url.toString());
  }, [view, roomCode]);

  if (view === 'host') return <HostScreen />;
  if (view === 'player' && roomCode) return <PlayerScreen roomCode={roomCode} />;

  return (
    <HomeScreen
      onHostClick={() => setState({ view: 'host' })}
      onPlayerClick={(code) => setState({ view: 'player', roomCode: code })}
    />
  );
}

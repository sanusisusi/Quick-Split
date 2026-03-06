import { useEffect, useState } from 'react';
import CreateSession from './pages/CreateSession';
import SessionDashboard from './pages/SessionDashboard';
import JoinSession from './pages/JoinSession';
import ParticipantView from './pages/ParticipantView';

type Route =
  | { type: 'home' }
  | { type: 'dashboard'; sessionId: string }
  | { type: 'join'; sessionId: string }
  | { type: 'participant'; participantId: string };

function App() {
  const [route, setRoute] = useState<Route>({ type: 'home' });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);

      if (!hash) {
        setRoute({ type: 'home' });
        return;
      }

      const [routeType, id] = hash.split('/');

      if (routeType === 'dashboard' && id) {
        setRoute({ type: 'dashboard', sessionId: id });
      } else if (routeType === 'join' && id) {
        setRoute({ type: 'join', sessionId: id });
      } else if (routeType === 'participant' && id) {
        setRoute({ type: 'participant', participantId: id });
      } else {
        setRoute({ type: 'home' });
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSessionCreated = (sessionId: string) => {
    window.location.hash = `dashboard/${sessionId}`;
  };

  const handleBackToHome = () => {
    window.location.hash = '';
  };

  const handleParticipantJoined = (participantId: string) => {
    window.location.hash = `participant/${participantId}`;
  };

  if (route.type === 'dashboard') {
    return <SessionDashboard sessionId={route.sessionId} onBack={handleBackToHome} />;
  }

  if (route.type === 'join') {
    return <JoinSession sessionId={route.sessionId} onJoined={handleParticipantJoined} />;
  }

  if (route.type === 'participant') {
    return <ParticipantView participantId={route.participantId} />;
  }

  return <CreateSession onSessionCreated={handleSessionCreated} />;
}

export default App;

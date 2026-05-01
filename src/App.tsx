import { useState } from "react";
import { AppShell } from "./app/AppShell";
import { LoginScreen } from "./features/login/LoginScreen";
import { LoginOpeningMovie } from "./features/onboarding/LoginOpeningMovie";
import { useLocalLogin } from "./state/useLocalLogin";

export default function App() {
  const { userName, login, logout } = useLocalLogin();
  const [showOpeningMovie, setShowOpeningMovie] = useState(false);

  const handleLogin = (name: string): boolean => {
    const success = login(name);
    if (success) {
      setShowOpeningMovie(true);
    }
    return success;
  };

  const handleLogout = (): void => {
    setShowOpeningMovie(false);
    logout();
  };

  if (!userName) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (showOpeningMovie) {
    return (
      <LoginOpeningMovie
        userName={userName}
        onComplete={() => setShowOpeningMovie(false)}
      />
    );
  }

  return <AppShell userName={userName} onLogout={handleLogout} />;
}

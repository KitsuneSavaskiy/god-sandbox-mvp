import { AppShell } from "./app/AppShell";
import { LoginScreen } from "./features/login/LoginScreen";
import { useLocalLogin } from "./state/useLocalLogin";

export default function App() {
  const { userName, login, logout } = useLocalLogin();

  if (!userName) {
    return <LoginScreen onLogin={login} />;
  }

  return <AppShell userName={userName} onLogout={logout} />;
}

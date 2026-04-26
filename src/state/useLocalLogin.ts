import { useState } from "react";

const STORAGE_KEY = "god-sandbox-mvp.loginUser";
const MAX_NAME_LENGTH = 32;

function readStoredName(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value && value.trim() ? value : null;
  } catch {
    return null;
  }
}

export function useLocalLogin() {
  const [userName, setUserName] = useState<string | null>(readStoredName);

  function login(rawName: string): boolean {
    const trimmed = rawName.trim().slice(0, MAX_NAME_LENGTH);
    if (!trimmed) {
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
      // ignore write failures in sandboxed environments
    }
    setUserName(trimmed);
    return true;
  }

  function logout(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setUserName(null);
  }

  return { userName, login, logout };
}

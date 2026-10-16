import { useEffect } from 'react';
import { tokenManager } from '../../core/api/client';

/** Через сколько миллисекунд бездействия сессия завершается (по умолчанию 10 минут). */
export const IDLE_LIMIT_MS = 10 * 60 * 1000;

const LAST_ACTIVITY_KEY = 'nexora_last_activity';
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const;

export function useIdleLogout(limitMs: number = IDLE_LIMIT_MS): void {
  useEffect(() => {
    if (!tokenManager.getAccessToken()) {
      return;
    }

    const logout = () => {
      tokenManager.clearTokens();
      localStorage.removeItem('nexora_user');
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      window.location.assign('/login');
    };

    const check = () => {
      const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) ?? Date.now());
      if (Date.now() - last > limitMs) {
        logout();
      }
    };

    let lastWrite = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite > 5000) {
        lastWrite = now;
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      }
    };

    // Сначала проверяем старую отметку (вернулись после долгого отсутствия), потом обновляем
    check();
    onActivity();

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', check);
    const timer = window.setInterval(check, 15000);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', check);
      window.clearInterval(timer);
    };
  }, [limitMs]);
}

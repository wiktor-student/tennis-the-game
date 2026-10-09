import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../store/settings';

/**
 * Screen navigation wrapped in a same-document View Transition (progressive enhancement).
 * After the DOM update, focus moves to the new screen's heading for keyboard and AT users.
 */
export function useGo(): (path: string) => void {
  const navigate = useNavigate();
  const motion = useSettings((s) => s.motion);
  return useCallback(
    (path: string) => {
      const focusHeading = () => document.getElementById('screen-title')?.focus();
      if (motion === 'none' || !document.startViewTransition) {
        navigate(path);
        requestAnimationFrame(focusHeading);
        return;
      }
      const transition = document.startViewTransition(() => {
        flushSync(() => navigate(path));
      });
      transition.finished.finally(focusHeading);
    },
    [navigate, motion],
  );
}

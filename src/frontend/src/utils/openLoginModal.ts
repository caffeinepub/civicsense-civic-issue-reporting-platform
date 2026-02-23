import { toast } from 'sonner';

const LOGIN_MODAL_EVENT = 'open-login-modal';

/**
 * Shared utility to reliably open the global login selection modal.
 * Uses both direct function call and custom event as fallback.
 */
export function openLoginModal(): void {
  const attemptOpen = (retries = 0): void => {
    // Try direct function call first
    if (typeof window !== 'undefined' && (window as any).openLoginModal) {
      try {
        console.log('→ Calling openLoginModal trigger (direct)');
        (window as any).openLoginModal();
        return;
      } catch (error) {
        console.error('Error opening login modal:', error);
      }
    }
    
    // Fallback: dispatch custom event
    if (typeof window !== 'undefined') {
      console.log('→ Dispatching login modal event (fallback)');
      window.dispatchEvent(new CustomEvent(LOGIN_MODAL_EVENT));
      return;
    }
    
    // Retry logic if neither method worked
    if (retries < 5) {
      console.log(`Login modal not ready, retrying... (${retries + 1}/5)`);
      setTimeout(() => attemptOpen(retries + 1), 150);
    } else {
      console.error('Login modal not available after retries');
      toast.error('Login is temporarily unavailable. Please refresh the page and try again.');
    }
  };

  attemptOpen();
}

export { LOGIN_MODAL_EVENT };

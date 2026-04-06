import { toast } from "sonner";

export const LOGIN_MODAL_EVENT = "open-login-modal";

/**
 * Shared utility to reliably open the global login selection modal.
 * Optionally pre-select a role: 'public' | 'municipal'
 */
export function openLoginModal(role?: "public" | "municipal"): void {
  const attemptOpen = (retries = 0): void => {
    if (typeof window !== "undefined" && (window as any).openLoginModal) {
      try {
        (window as any).openLoginModal(role);
        return;
      } catch (error) {
        console.error("Error opening login modal:", error);
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(LOGIN_MODAL_EVENT, { detail: { role } }),
      );
      return;
    }

    if (retries < 5) {
      setTimeout(() => attemptOpen(retries + 1), 150);
    } else {
      toast.error(
        "Login is temporarily unavailable. Please refresh the page and try again.",
      );
    }
  };

  attemptOpen();
}

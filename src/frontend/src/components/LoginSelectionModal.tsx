import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Eye, EyeOff, UserPlus, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { setDemoSession } from "../utils/demoSession";
import { LOGIN_MODAL_EVENT } from "../utils/openLoginModal";

type DemoRole = "public" | "municipal";

// Passwords for both user types
const PASSWORDS: Record<DemoRole, string> = {
  public: "public@2024",
  municipal: "civic@2024",
};

/**
 * When role is "municipal" → authority-only login (no role picker, no sign up).
 * When role is "public" → public-user login with "Register New" option.
 */
export default function LoginSelectionModal() {
  const [showModal, setShowModal] = useState(false);
  // The forced role from the opener — null means not yet set
  const [forcedRole, setForcedRole] = useState<DemoRole>("public");
  // "login" or "register" — only relevant for public role
  const [mode, setMode] = useState<"login" | "register">("login");

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const openModal = (role?: DemoRole) => {
      const resolvedRole = role ?? "public";
      setForcedRole(resolvedRole);
      setMode("login");
      setName("");
      setNameError("");
      setPassword("");
      setPasswordError("");
      setShowPassword(false);
      setShowModal(true);
    };

    if (typeof window !== "undefined") {
      (
        window as Window & { openLoginModal?: (role?: DemoRole) => void }
      ).openLoginModal = openModal;
    }

    const handleEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      openModal(detail?.role);
    };
    window.addEventListener(LOGIN_MODAL_EVENT, handleEvent);

    return () => {
      if (typeof window !== "undefined") {
        (
          window as Window & { openLoginModal?: (role?: DemoRole) => void }
        ).openLoginModal = undefined;
      }
      window.removeEventListener(LOGIN_MODAL_EVENT, handleEvent);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setNameError("Please enter your name to continue.");
      return;
    }

    if (mode === "register") {
      // Registration: create account with the default public password
      setDemoSession({ name: trimmed, role: "public" });
      setShowModal(false);
      resetForm();
      window.location.reload();
      return;
    }

    // Login mode
    if (!password) {
      setPasswordError(
        forcedRole === "municipal"
          ? "Password is required for Authority Staff."
          : "Password is required to continue.",
      );
      return;
    }
    if (password !== PASSWORDS[forcedRole]) {
      setPasswordError("Incorrect password. Please try again.");
      return;
    }

    setDemoSession({ name: trimmed, role: forcedRole });
    setShowModal(false);
    resetForm();
    window.location.reload();
  };

  const resetForm = () => {
    setName("");
    setNameError("");
    setPassword("");
    setPasswordError("");
    setMode("login");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setShowModal(false);
      resetForm();
    }
  };

  const switchToRegister = () => {
    setMode("register");
    setPassword("");
    setPasswordError("");
    setNameError("");
  };

  const switchToLogin = () => {
    setMode("login");
    setPassword("");
    setPasswordError("");
    setNameError("");
  };

  const isMunicipal = forcedRole === "municipal";
  const isRegister = mode === "register";

  return (
    <Dialog open={showModal} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[420px] animate-in fade-in zoom-in-95 duration-200"
        data-ocid="login.dialog"
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-1">
            <div
              className={[
                "flex h-12 w-12 items-center justify-center rounded-full",
                isMunicipal
                  ? "bg-accent/15 text-accent"
                  : "bg-primary/15 text-primary",
              ].join(" ")}
            >
              {isMunicipal ? (
                <Building2 className="h-6 w-6" />
              ) : isRegister ? (
                <UserPlus className="h-6 w-6" />
              ) : (
                <Users className="h-6 w-6" />
              )}
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            {isMunicipal
              ? "Authority Portal"
              : isRegister
                ? "Create Account"
                : "Citizen Login"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isMunicipal
              ? "Login with your municipal staff credentials"
              : isRegister
                ? "Register as a new citizen to report issues"
                : "Login to report and track civic issues"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Name field */}
          <div className="space-y-1.5">
            <Label htmlFor="demo-name" className="text-sm font-medium">
              {isMunicipal ? "Staff Name" : "Your Name"}
            </Label>
            <Input
              id="demo-name"
              data-ocid="login.input"
              placeholder={
                isMunicipal ? "e.g. Officer Ramesh" : "e.g. Priya Sharma"
              }
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError("");
              }}
              autoFocus
              autoComplete="off"
              className="h-11"
            />
            {nameError && (
              <p
                data-ocid="login.error_state"
                className="text-xs text-destructive"
              >
                {nameError}
              </p>
            )}
          </div>

          {/* Password field — only for login (not register) */}
          {!isRegister && (
            <div className="space-y-1.5">
              <Label htmlFor="user-password" className="text-sm font-medium">
                {isMunicipal ? "Staff Password" : "Access Password"}
              </Label>
              <div className="relative">
                <Input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    isMunicipal
                      ? "Enter staff password"
                      : "Enter access password"
                  }
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}
              {!passwordError && (
                <p className="text-xs text-muted-foreground">
                  {isMunicipal ? "Use: civic@2024" : "Use: public@2024"}
                </p>
              )}
            </div>
          )}

          {/* Register note */}
          {isRegister && (
            <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
              Your account will be created instantly. You can start reporting
              civic issues right away.
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            data-ocid="login.submit_button"
            className="w-full h-11 gap-2 text-base font-semibold"
          >
            <Zap className="h-4 w-4" />
            {isMunicipal
              ? "Login as Authority Staff"
              : isRegister
                ? "Create Account"
                : "Login as Citizen"}
          </Button>

          {/* Public portal toggle: Login ↔ Register New */}
          {!isMunicipal && (
            <div className="text-center text-sm text-muted-foreground">
              {isRegister ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="font-medium text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  New citizen?{" "}
                  <button
                    type="button"
                    data-ocid="login.register_new"
                    onClick={switchToRegister}
                    className="font-medium text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                  >
                    Register New
                  </button>
                </>
              )}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

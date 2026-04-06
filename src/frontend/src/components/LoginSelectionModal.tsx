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
import { Building2, CheckCircle2, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { setDemoSession } from "../utils/demoSession";
import { LOGIN_MODAL_EVENT } from "../utils/openLoginModal";

type DemoRole = "public" | "municipal";

export default function LoginSelectionModal() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<DemoRole>("public");
  const [nameError, setNameError] = useState("");

  // Register global modal trigger - state setters are stable references
  useEffect(() => {
    const openModal = (role?: DemoRole) => {
      // Inline reset
      setName("");
      setNameError("");
      setSelectedRole(role ?? "public");
      setShowModal(true);
    };

    if (typeof window !== "undefined") {
      (window as any).openLoginModal = openModal;
    }

    const handleEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      openModal(detail?.role);
    };
    window.addEventListener(LOGIN_MODAL_EVENT, handleEvent);

    return () => {
      if (typeof window !== "undefined") {
        (window as any).openLoginModal = undefined;
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
    setDemoSession({ name: trimmed, role: selectedRole });
    setShowModal(false);
    setName("");
    setNameError("");
    setSelectedRole("public");
    // Reload so all components pick up the new session
    window.location.reload();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setShowModal(false);
      setName("");
      setNameError("");
      setSelectedRole("public");
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[440px] animate-in fade-in zoom-in-95 duration-200"
        data-ocid="login.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Welcome to CivicSense
          </DialogTitle>
          <DialogDescription className="text-center">
            Enter your name and choose your role to get started instantly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Name field */}
          <div className="space-y-1.5">
            <Label htmlFor="demo-name" className="text-sm font-medium">
              Your Name
            </Label>
            <Input
              id="demo-name"
              data-ocid="login.input"
              placeholder="e.g. Priya Sharma"
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

          {/* Role selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Choose Your Role</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Public User card */}
              <button
                type="button"
                data-ocid="login.tab"
                onClick={() => setSelectedRole("public")}
                className={[
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200",
                  selectedRole === "public"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50 hover:bg-muted/40",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    selectedRole === "public"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Public User</p>
                  <p className="text-xs text-muted-foreground">Report issues</p>
                </div>
                {selectedRole === "public" && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </button>

              {/* Municipal Staff card */}
              <button
                type="button"
                data-ocid="login.tab"
                onClick={() => setSelectedRole("municipal")}
                className={[
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200",
                  selectedRole === "municipal"
                    ? "border-accent bg-accent/5 shadow-sm"
                    : "border-border hover:border-accent/50 hover:bg-muted/40",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                    selectedRole === "municipal"
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Municipal Staff</p>
                  <p className="text-xs text-muted-foreground">Manage issues</p>
                </div>
                {selectedRole === "municipal" && (
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            data-ocid="login.submit_button"
            className="w-full h-11 gap-2 text-base font-semibold"
          >
            <Zap className="h-4 w-4" />
            Login Instantly
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

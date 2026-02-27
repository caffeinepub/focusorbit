import { useState } from "react";
import { Orbit, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSaveCallerUserProfile } from "../hooks/useQueries";
import { toast } from "sonner";

interface ProfileSetupModalProps {
  open: boolean;
}

export function ProfileSetupModal({ open }: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const saveProfile = useSaveCallerUserProfile();

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await saveProfile.mutateAsync({ name: trimmed });
      toast.success("Profile saved! Welcome to FocusOrbit.");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && name.trim()) {
      void handleSave();
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => { /* can't dismiss — must set name */ }}>
      <DialogContent
        className="max-w-sm"
        style={{
          background: "oklch(0.12 0.025 265 / 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid oklch(0.72 0.18 220 / 0.20)",
          boxShadow:
            "0 0 40px oklch(0.72 0.18 220 / 0.10), 0 0 80px oklch(0.72 0.18 220 / 0.05)",
        }}
        // prevent the default close button from appearing
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 pb-2">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.72 0.18 220 / 0.12)",
                border: "1.5px solid oklch(0.72 0.18 220 / 0.30)",
                boxShadow: "0 0 20px oklch(0.72 0.18 220 / 0.25)",
              }}
            >
              <Orbit className="w-7 h-7" style={{ color: "oklch(0.72 0.18 220)" }} />
            </div>
            <DialogTitle className="font-orbitron text-lg text-center tracking-wide text-foreground">
              Set Your Call Sign
            </DialogTitle>
            <p className="text-xs font-grotesk text-center" style={{ color: "oklch(0.50 0.04 265)" }}>
              What should we call you, astronaut?
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label
              htmlFor="profile-name"
              className="text-sm font-grotesk font-medium"
              style={{ color: "oklch(0.65 0.06 265)" }}
            >
              Your Name
            </Label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "oklch(0.50 0.04 265)" }}
              />
              <Input
                id="profile-name"
                placeholder="e.g. Commander Nova"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={50}
                autoFocus
                className="pl-10 font-grotesk"
                style={{
                  background: "oklch(0.16 0.03 265)",
                  border: "1px solid oklch(0.30 0.05 265)",
                  color: "oklch(0.90 0.02 240)",
                }}
              />
            </div>
          </div>

          <Button
            onClick={() => void handleSave()}
            disabled={!name.trim() || saveProfile.isPending}
            className="w-full font-orbitron text-sm tracking-wider"
            style={{
              background: "oklch(0.72 0.18 220 / 0.18)",
              border: "1.5px solid oklch(0.72 0.18 220 / 0.45)",
              color: "oklch(0.88 0.10 220)",
              boxShadow: "0 0 16px oklch(0.72 0.18 220 / 0.15)",
            }}
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "ENTER ORBIT"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

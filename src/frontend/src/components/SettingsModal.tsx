import { useState, useEffect } from "react";
import { Settings, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useSettings, useSaveSettings } from "../hooks/useQueries";
import { toast } from "sonner";

export function SettingsModal() {
  const { data: settings } = useSettings();
  const saveSettings = useSaveSettings();

  const [focusDur, setFocusDur] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [interval, setInterval] = useState(4);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setFocusDur(Number(settings.focusDuration));
      setShortBreak(Number(settings.shortBreakDuration));
      setLongBreak(Number(settings.longBreakDuration));
      setInterval(Number(settings.longBreakInterval));
    }
  }, [settings]);

  async function handleSave() {
    try {
      await saveSettings.mutateAsync({
        focusDuration: BigInt(focusDur),
        shortBreakDuration: BigInt(shortBreak),
        longBreakDuration: BigInt(longBreak),
        longBreakInterval: BigInt(interval),
      });
      toast.success("Settings saved! Timer updated.");
      setOpen(false);
    } catch (_e) {
      toast.error("Failed to save settings.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="glass-card border-border/50 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-space-blue" />
            Mission Parameters
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Focus Duration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">
                Focus Session
              </Label>
              <span className="font-timer text-lg text-space-blue font-semibold">
                {focusDur} min
              </span>
            </div>
            <Slider
              value={[focusDur]}
              min={1}
              max={120}
              step={1}
              onValueChange={([v]) => setFocusDur(v)}
              className="[&>span[role=slider]]:bg-space-blue"
            />
            <div className="flex justify-between text-xs text-muted-foreground/60">
              <span>1 min</span>
              <span>120 min</span>
            </div>
          </div>

          {/* Short Break */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">
                Short Break
              </Label>
              <span className="font-timer text-lg text-space-gold font-semibold">
                {shortBreak} min
              </span>
            </div>
            <Slider
              value={[shortBreak]}
              min={1}
              max={30}
              step={1}
              onValueChange={([v]) => setShortBreak(v)}
              className="[&>span[role=slider]]:bg-space-gold"
            />
            <div className="flex justify-between text-xs text-muted-foreground/60">
              <span>1 min</span>
              <span>30 min</span>
            </div>
          </div>

          {/* Long Break */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">
                Long Break
              </Label>
              <span className="font-timer text-lg text-space-purple font-semibold">
                {longBreak} min
              </span>
            </div>
            <Slider
              value={[longBreak]}
              min={1}
              max={120}
              step={1}
              onValueChange={([v]) => setLongBreak(v)}
              className="[&>span[role=slider]]:bg-space-purple"
            />
            <div className="flex justify-between text-xs text-muted-foreground/60">
              <span>1 min</span>
              <span>120 min</span>
            </div>
          </div>

          {/* Long Break Interval */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">
                Long Break Every
              </Label>
              <span className="font-timer text-lg text-foreground font-semibold">
                {interval} sessions
              </span>
            </div>
            <Slider
              value={[interval]}
              min={2}
              max={8}
              step={1}
              onValueChange={([v]) => setInterval(v)}
            />
            <div className="flex justify-between text-xs text-muted-foreground/60">
              <span>2 sessions</span>
              <span>8 sessions</span>
            </div>
          </div>

          {/* Save */}
          <Button
            className="w-full gap-2 bg-space-blue/20 text-space-blue border border-space-blue/40 hover:bg-space-blue/30 hover:border-space-blue/70 transition-all"
            onClick={handleSave}
            disabled={saveSettings.isPending}
          >
            {saveSettings.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-space-blue/40 border-t-space-blue rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

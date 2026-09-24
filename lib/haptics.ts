// Best-effort native vibration for the devices that support it (most
// Android browsers; iOS Safari has no Vibration API at all, where the
// CSS tap-scale in globals.css is the only feedback available).
export function haptic(durationMs = 8) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // no-op — some browsers throw if called outside a user gesture
    }
  }
}

/**
 * Trigger subtle haptic feedback if supported by browser/device
 * (Primarily Android Chrome)
 */
export function triggerHaptic(durationMs = 40): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignore silence/failure on unsupported browsers
    }
  }
}

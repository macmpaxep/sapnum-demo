"use client";

// Lightweight global trigger for the post-composer modal, so any button
// (feed teaser row, header "+" menu, mobile bottom-bar "+") can open it
// without prop-drilling a shared open/close state through every layout.
const EVENT_NAME = "sapnum:open-post-composer";

// iOS Safari only auto-raises the keyboard for a .focus() called
// synchronously inside the original click's call stack — by the time a
// useEffect (even via requestAnimationFrame) reacts to a state change, the
// browser no longer trusts it as user-initiated. So the modal registers its
// (always-mounted) textarea here, and openComposer() focuses it directly,
// in the same tick as the triggering onClick, before the open animation runs.
let registeredTextarea: HTMLTextAreaElement | null = null;

export function registerComposerTextarea(el: HTMLTextAreaElement | null) {
  registeredTextarea = el;
}

export function openComposer() {
  registeredTextarea?.focus();
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function listenForComposerOpen(callback: () => void) {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}

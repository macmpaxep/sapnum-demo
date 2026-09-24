"use client";

// Lightweight global trigger for the post-composer modal, so any button
// (feed teaser row, header "+" menu, mobile bottom-bar "+") can open it
// without prop-drilling a shared open/close state through every layout.
const EVENT_NAME = "sapnum:open-post-composer";

export function openComposer() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function listenForComposerOpen(callback: () => void) {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}

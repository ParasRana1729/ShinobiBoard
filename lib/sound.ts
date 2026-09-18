"use client";

/**
 * @deprecated Dojo sound effects have been removed per UI/UX cleanup.
 * No-op stubs retained for interface backward compatibility.
 */

export type SoundEffect = "clapper" | "blade" | "bell";

export function isSoundEnabled(): boolean {
  return false;
}

export function setSoundEnabled(_enabled: boolean): void {}

export function playSound(_effect: SoundEffect): void {}

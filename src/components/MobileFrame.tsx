import type { ReactNode } from "react";

/**
 * Wraps content in a phone-like column on wider screens, full-bleed on mobile.
 * Keeps the app feeling like a native mobile experience.
 */
export function MobileFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen w-full bg-sand/40 flex justify-center">
      <div className={`w-full max-w-md min-h-screen bg-background shadow-card relative overflow-hidden ${className}`}>
        {children}
      </div>
    </div>
  );
}

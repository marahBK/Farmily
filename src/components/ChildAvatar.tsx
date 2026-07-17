import type { Avatar } from "@/lib/child-store";

/**
 * Cute SVG avatar composed from customization options.
 */
export function ChildAvatar({ a, size = 96 }: { a: Avatar; size?: number }) {
  const skin = "#f5d0a9";
  const hair = a.hairColor;
  const clothes = a.clothes;
  const shoes = a.shoes;

  return (
    <svg viewBox="0 0 100 120" width={size} height={size * 1.2} className="drop-shadow-sm">
      {/* legs */}
      <rect x="38" y="88" width="10" height="18" rx="3" fill={clothes} />
      <rect x="52" y="88" width="10" height="18" rx="3" fill={clothes} />
      {/* shoes */}
      <ellipse cx="43" cy="108" rx="7" ry="4" fill={shoes} />
      <ellipse cx="57" cy="108" rx="7" ry="4" fill={shoes} />
      {/* body */}
      <rect x="30" y="55" width="40" height="38" rx="10" fill={clothes} />
      {/* arms */}
      <rect x="20" y="58" width="10" height="26" rx="5" fill={clothes} />
      <rect x="70" y="58" width="10" height="26" rx="5" fill={clothes} />
      <circle cx="25" cy="86" r="5" fill={skin} />
      <circle cx="75" cy="86" r="5" fill={skin} />
      {/* neck */}
      <rect x="45" y="48" width="10" height="10" fill={skin} />
      {/* head */}
      <circle cx="50" cy="35" r="18" fill={skin} />
      {/* hair styles */}
      {a.hair === "short" && (
        <path d="M32 32 Q32 15 50 15 Q68 15 68 32 Q60 25 50 25 Q40 25 32 32 Z" fill={hair} />
      )}
      {a.hair === "long" && (
        <>
          <path d="M30 40 Q28 15 50 13 Q72 15 70 40 L70 55 L64 55 L64 30 Q50 24 36 30 L36 55 L30 55 Z" fill={hair} />
        </>
      )}
      {a.hair === "curly" && (
        <>
          <circle cx="38" cy="22" r="8" fill={hair} />
          <circle cx="50" cy="18" r="9" fill={hair} />
          <circle cx="62" cy="22" r="8" fill={hair} />
          <circle cx="34" cy="30" r="6" fill={hair} />
          <circle cx="66" cy="30" r="6" fill={hair} />
        </>
      )}
      {a.hair === "cap" && (
        <>
          <path d="M32 32 Q32 15 50 15 Q68 15 68 32 Z" fill={hair} />
          <rect x="30" y="30" width="40" height="5" rx="2" fill={hair} />
        </>
      )}
      {/* eyes */}
      <circle cx="43" cy="36" r="2" fill="#2a2a2a" />
      <circle cx="57" cy="36" r="2" fill="#2a2a2a" />
      {/* smile */}
      <path d="M44 43 Q50 47 56 43" stroke="#2a2a2a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* accessory */}
      {a.accessory === "glasses" && (
        <>
          <circle cx="43" cy="36" r="4" stroke="#333" strokeWidth="1.2" fill="none" />
          <circle cx="57" cy="36" r="4" stroke="#333" strokeWidth="1.2" fill="none" />
          <line x1="47" y1="36" x2="53" y2="36" stroke="#333" strokeWidth="1.2" />
        </>
      )}
      {a.accessory === "bow" && a.gender === "girl" && (
        <path d="M40 15 L50 20 L60 15 L57 22 L50 20 L43 22 Z" fill="#ec4899" />
      )}
      {a.accessory === "hat" && (
        <>
          <ellipse cx="50" cy="18" rx="22" ry="4" fill="#7c3f00" />
          <ellipse cx="50" cy="14" rx="12" ry="8" fill="#a0522d" />
        </>
      )}
    </svg>
  );
}

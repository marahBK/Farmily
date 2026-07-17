import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MobileFrame } from "@/components/MobileFrame";
import { useChild } from "@/lib/child-store";
import { ChildAvatar } from "@/components/ChildAvatar";

export const Route = createFileRoute("/child/arrival")({
  head: () => ({ meta: [{ title: "Arriving at Your Farm — Farmily" }] }),
  component: Arrival,
});

function Arrival() {
  const { avatar, name, markArrivalSeen } = useChild();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      markArrivalSeen();
      navigate({ to: "/child/farm" });
    }, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!avatar) {
    navigate({ to: "/child/create" });
    return null;
  }

  return (
    <MobileFrame>
      <div
        className="relative min-h-screen overflow-hidden"
        style={{ background: "linear-gradient(180deg, #87CEEB 0%, #b0e8f5 40%, #c8f0c0 70%, #6db860 100%)" }}
      >
        {/* Animated sun */}
        <div
          className="absolute top-8 right-10 w-20 h-20 rounded-full"
          style={{
            background: "radial-gradient(circle, #ffe066 30%, #ffaa00 100%)",
            boxShadow: "0 0 60px #ffd700, 0 0 120px rgba(255,215,0,0.3)",
            animation: "sun-rise 1s ease-out forwards",
          }}
        />

        {/* Clouds — animated drift */}
        <div className="absolute top-10 left-0 text-5xl opacity-90 animate-cloud-drift-1">☁️</div>
        <div className="absolute top-20 left-20 text-3xl opacity-70 animate-cloud-drift-2">☁️</div>
        <div className="absolute top-6 right-28 text-4xl opacity-80 animate-cloud-drift-3">☁️</div>

        {/* Rolling hills (SVG) */}
        <svg
          className="absolute w-full"
          style={{ bottom: "38%", height: "120px" }}
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
        >
          <path d="M0 100 Q80 30 160 70 Q240 110 320 50 Q370 20 400 60 L400 120 L0 120 Z" fill="#5cb85c" opacity="0.5" />
          <path d="M0 110 Q100 60 200 90 Q300 120 400 80 L400 120 L0 120 Z" fill="#4a9e4a" opacity="0.7" />
        </svg>

        {/* Ground */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            top: "62%",
            background: "linear-gradient(180deg, #5cb85c 0%, #4a9e4a 20%, #3d8b3d 100%)",
          }}
        />

        {/* Dirt road */}
        <div
          className="absolute"
          style={{
            bottom: "22%",
            left: 0,
            right: 0,
            height: "16px",
            background: "linear-gradient(180deg, #d2a679, #c4935a)",
            boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
          }}
        />

        {/* Farm scene elements */}
        {/* House */}
        <div
          className="absolute"
          style={{
            left: "5%",
            bottom: "38%",
            fontSize: "72px",
            filter: "drop-shadow(3px 5px 8px rgba(0,0,0,0.25))",
            animation: "scene-pop 0.6s ease-out 0.3s both",
          }}
        >
          🏡
        </div>

        {/* Trees */}
        <div
          className="absolute"
          style={{
            right: "8%",
            bottom: "40%",
            fontSize: "52px",
            filter: "drop-shadow(2px 3px 5px rgba(0,0,0,0.2))",
            animation: "scene-pop 0.6s ease-out 0.5s both",
          }}
        >
          🌲
        </div>
        <div
          className="absolute"
          style={{
            right: "18%",
            bottom: "42%",
            fontSize: "36px",
            filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.15))",
            animation: "scene-pop 0.6s ease-out 0.7s both",
          }}
        >
          🌳
        </div>

        {/* Farm sign */}
        <div
          className="absolute flex flex-col items-center"
          style={{ right: "6%", bottom: "32%", animation: "scene-pop 0.6s ease-out 0.9s both" }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #c98a4a, #a0622a)",
              color: "white",
              fontSize: "11px",
              fontWeight: 800,
              padding: "5px 10px",
              borderRadius: "6px",
              border: "2px solid #7a4420",
              boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
              whiteSpace: "nowrap",
              fontFamily: "Fraunces, serif",
            }}
          >
            {name}'s Farm
          </div>
          <div style={{ width: "4px", height: "28px", background: "#8B4513" }} />
        </div>

        {/* Mailbox */}
        <div
          className="absolute"
          style={{
            left: "28%",
            bottom: "28%",
            fontSize: "32px",
            filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.15))",
            animation: "scene-pop 0.6s ease-out 1.1s both",
          }}
        >
          📬
        </div>

        {/* Fence posts */}
        <div
          className="absolute left-0 right-0 flex justify-evenly"
          style={{ bottom: "28%", animation: "scene-pop 0.5s ease-out 0.2s both" }}
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "5px",
                height: "22px",
                background: "#8B4513",
                borderRadius: "2px 2px 0 0",
              }}
            />
          ))}
        </div>
        <div
          className="absolute left-0 right-0"
          style={{ bottom: "29%", height: "4px", background: "#8B4513", borderRadius: "2px", animation: "scene-pop 0.5s ease-out 0.2s both" }}
        />

        {/* Truck arriving animation */}
        <div
          className="absolute text-6xl"
          style={{ bottom: "23%", animation: "truck-drive 5s ease-in-out forwards" }}
        >
          🚚
        </div>

        {/* Child walking out */}
        <div
          className="absolute"
          style={{ bottom: "25%", animation: "child-emerge 5s ease-in-out forwards" }}
        >
          <ChildAvatar a={avatar} size={76} />
        </div>

        {/* Greeting text */}
        <div
          className="absolute bottom-6 left-0 right-0 flex justify-center px-6"
          style={{ animation: "fade-up 0.6s ease-out 2s both" }}
        >
          <div
            className="rounded-2xl px-5 py-3 text-center shadow-card"
            style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)" }}
          >
            <p className="font-display text-base font-bold">🎉 Welcome to your farm, {name}!</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your farming adventure begins…</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sun-rise {
          from { transform: translateY(20px); opacity: 0.6; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scene-pop {
          from { transform: scale(0.5) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes fade-up {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes truck-drive {
          0%   { transform: translateX(-120%); }
          40%  { transform: translateX(20vw); }
          60%  { transform: translateX(20vw); }
          65%  { transform: translateX(22vw); }
          100% { transform: translateX(120vw); }
        }
        @keyframes child-emerge {
          0%, 42%  { opacity: 0; transform: translateX(28vw); }
          48%  { opacity: 1; transform: translateX(28vw); }
          100% { opacity: 1; transform: translateX(52vw) translateY(-30px); }
        }
        @keyframes cloud-drift-1 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(12px); }
        }
        @keyframes cloud-drift-2 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-10px); }
        }
        @keyframes cloud-drift-3 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        .animate-cloud-drift-1 { animation: cloud-drift-1 6s ease-in-out infinite; }
        .animate-cloud-drift-2 { animation: cloud-drift-2 8s ease-in-out infinite; }
        .animate-cloud-drift-3 { animation: cloud-drift-3 7s ease-in-out infinite; }
      `}</style>
    </MobileFrame>
  );
}

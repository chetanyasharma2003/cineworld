/**
 * DynamicBg — reusable animated gradient background with floating orbs.
 * Props:
 *   variant: "red" | "purple" | "blue" | "green" (default: "red")
 *   intensity: "subtle" | "normal" | "vivid"     (default: "normal")
 */
export default function DynamicBg({ variant = "red", intensity = "normal" }) {
  const orbs = {
    red: [
      "radial-gradient(ellipse at center, rgba(229,9,20,0.35) 0%, transparent 70%)",
      "radial-gradient(ellipse at center, rgba(180,0,80,0.25) 0%, transparent 70%)",
      "radial-gradient(ellipse at center, rgba(255,60,0,0.20) 0%, transparent 70%)",
    ],
    purple: [
      "radial-gradient(ellipse at center, rgba(139,92,246,0.35) 0%, transparent 70%)",
      "radial-gradient(ellipse at center, rgba(220,38,127,0.25) 0%, transparent 70%)",
      "radial-gradient(ellipse at center, rgba(79,70,229,0.20) 0%, transparent 70%)",
    ],
    blue: [
      "radial-gradient(ellipse at center, rgba(37,99,235,0.35) 0%, transparent 70%)",
      "radial-gradient(ellipse at center, rgba(6,182,212,0.25) 0%, transparent 70%)",
      "radial-gradient(ellipse at center, rgba(99,102,241,0.20) 0%, transparent 70%)",
    ],
    green: [
      "radial-gradient(ellipse at center, rgba(16,185,129,0.35) 0%, transparent 70%)",
      "radial-gradient(ellipse at center, rgba(5,150,105,0.25) 0%, transparent 70%)",
      "radial-gradient(ellipse at center, rgba(6,182,212,0.20) 0%, transparent 70%)",
    ],
  };

  const opacityMap = { subtle: 0.5, normal: 1, vivid: 1.4 };
  const op = Math.min(opacityMap[intensity] || 1, 1);
  const colors = orbs[variant] || orbs.red;

  return (
    <>
      <style>{`
        @keyframes dynOrb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(60px,-40px) scale(1.15); }
          66%      { transform: translate(-40px,30px) scale(0.9); }
        }
        @keyframes dynOrb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-70px,50px) scale(1.2); }
        }
        @keyframes dynOrb3 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(50px,60px) scale(0.85); }
          80%      { transform: translate(-30px,-50px) scale(1.1); }
        }
        @keyframes gridPulse {
          0%,100% { opacity: 0.03; }
          50%      { opacity: 0.06; }
        }
      `}</style>

      {/* Dot grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          animation: "gridPulse 8s ease-in-out infinite",
          zIndex: 0,
        }}
      />

      {/* Orb 1 — top-left */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "-15%", left: "-10%",
          width: "55vw", height: "55vw",
          background: colors[0],
          borderRadius: "50%",
          opacity: op,
          filter: "blur(60px)",
          animation: "dynOrb1 18s ease-in-out infinite",
          zIndex: 0,
        }}
      />

      {/* Orb 2 — bottom-right */}
      <div
        className="fixed pointer-events-none"
        style={{
          bottom: "-20%", right: "-15%",
          width: "60vw", height: "60vw",
          background: colors[1],
          borderRadius: "50%",
          opacity: op,
          filter: "blur(80px)",
          animation: "dynOrb2 22s ease-in-out infinite",
          zIndex: 0,
        }}
      />

      {/* Orb 3 — center */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "30%", left: "40%",
          width: "40vw", height: "40vw",
          background: colors[2],
          borderRadius: "50%",
          opacity: op * 0.7,
          filter: "blur(100px)",
          animation: "dynOrb3 26s ease-in-out infinite",
          zIndex: 0,
        }}
      />

      {/* Noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
          opacity: 0.4,
          zIndex: 0,
        }}
      />
    </>
  );
}

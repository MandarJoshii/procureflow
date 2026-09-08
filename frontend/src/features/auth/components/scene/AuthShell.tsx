import { type ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import AuthScene from "./AuthScene";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export default function AuthShell({
  mode,
  children,
}: {
  mode: "login" | "signup";
  children: ReactNode;
}) {
  const reduced = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07080c] flex flex-col items-center justify-center px-6 py-14">
      {/* 3D core — desktop only, disabled entirely under reduced motion for a static fallback */}
      <div className="absolute inset-0">
        <AuthScene mode={mode} />
      </div>

      {/* fine grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* vignette so the panel always reads clearly against the scene */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, transparent 30%, rgba(7,8,12,0.55) 78%, rgba(7,8,12,0.92) 100%)",
        }}
      />

      {/* wordmark */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center gap-2 mb-8"
      >
        <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
          <circle cx="4" cy="18" r="2" fill="#818cf8" />
          <circle cx="11" cy="4" r="2" fill="#818cf8" opacity="0.55" />
          <circle cx="18" cy="18" r="2" fill="#818cf8" />
          <path
            d="M4 16 C 7 10, 8 6, 11 6 C 14 6, 15 10, 18 16"
            stroke="#818cf8"
            strokeWidth="1.2"
            fill="none"
            opacity="0.6"
          />
        </svg>
        <span className="text-[13px] font-medium tracking-wide text-white/70">ProcureFlow</span>
      </motion.div>

      {/* the floating panel */}
      <div className="relative z-10">{children}</div>

      {/* system status line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative z-10 mt-8 flex items-center gap-2"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
        </span>
        <span className="text-[11px] tracking-wide text-white/35 font-mono">
          Encrypted connection · session ready
        </span>
      </motion.div>
    </div>
  );
}
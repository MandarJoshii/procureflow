import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import AuthShell from "./scene/AuthShell";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

export default function AuthPage() {
  const location = useLocation();
  const mode: "login" | "signup" = location.pathname.startsWith("/signup") ? "signup" : "login";

  return (
    <AuthShell mode={mode}>
      <div
        className="w-[380px] rounded-2xl px-8 pt-8 pb-7 overflow-hidden"
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.09)",
          backdropFilter: "blur(24px)",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.05) inset, 0 30px 60px -15px rgba(0,0,0,0.65)",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {mode === "login" ? <LoginForm /> : <SignupForm />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AuthShell>
  );
}
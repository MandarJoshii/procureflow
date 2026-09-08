import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {children}
    </div>
  );
}

export function CardRow({ children, className = "", as: As = "div" }: { children: ReactNode; className?: string; as?: any }) {
  return (
    <As className={`px-5 py-4 flex items-center justify-between ${className}`}>
      {children}
    </As>
  );
}

const badgeColors: Record<string, string> = {
  PENDING_VERIFICATION: "text-amber-300 bg-amber-400/10",
  ACTIVE: "text-emerald-300 bg-emerald-400/10",
  SUSPENDED: "text-rose-300 bg-rose-400/10",
  DRAFT: "text-white/40 bg-white/5",
  SENT: "text-sky-300 bg-sky-400/10",
  CLOSED: "text-white/40 bg-white/5",
  AWARDED: "text-emerald-300 bg-emerald-400/10",
  SUBMITTED: "text-white/50 bg-white/5",
  SELECTED: "text-emerald-300 bg-emerald-400/10",
  REJECTED: "text-rose-300 bg-rose-400/10",
  PENDING_APPROVAL: "text-amber-300 bg-amber-400/10",
  APPROVED: "text-emerald-300 bg-emerald-400/10",
  FULFILLED: "text-sky-300 bg-sky-400/10",
  PENDING: "text-amber-300 bg-amber-400/10",
  SKIPPED: "text-white/30 bg-white/5",
  PAYMENT_RELEASED: "text-amber-300 bg-amber-400/10",
  PAID: "text-emerald-300 bg-emerald-400/10",
  INITIATED: "text-amber-300 bg-amber-400/10",
  PROCESSING: "text-sky-300 bg-sky-400/10",
  COMPLETED: "text-emerald-300 bg-emerald-400/10",
  FAILED: "text-rose-300 bg-rose-400/10",
};

export function Badge({ status }: { status: string }) {
  const classes = badgeColors[status] ?? "text-white/40 bg-white/5";
  return (
    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${classes}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: { children: ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg text-white text-sm font-medium px-4 py-2 transition-all active:scale-[0.98] disabled:opacity-50 ${className}`}
      style={{ backgroundColor: "#4f46e5" }}
      onMouseEnter={(e) => {
        if (!props.disabled) e.currentTarget.style.backgroundColor = "#4338ca";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#4f46e5";
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: { children: ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg text-sm font-medium px-4 py-2 transition-colors text-white/70 hover:text-white ${className}`}
      style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {children}
    </button>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg px-3.5 py-2.5 text-sm outline-none text-white/90 placeholder:text-white/25 transition-colors focus:border-indigo-400 ${props.className ?? ""}`}
      style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg px-3.5 py-2.5 text-sm outline-none text-white/90 placeholder:text-white/25 transition-colors focus:border-indigo-400 ${props.className ?? ""}`}
      style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="block text-xs font-medium text-white/40 mb-1.5">{children}</label>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-[11px] uppercase tracking-wider text-white/35 mb-3">{children}</h2>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Card className="p-8 text-center">
      <p className="text-white/35 text-sm">{children}</p>
    </Card>
  );
}
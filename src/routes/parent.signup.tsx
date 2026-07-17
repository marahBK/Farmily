import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { useFarmily } from "@/lib/farmily-store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/parent/signup")({
  head: () => ({ meta: [{ title: "Create Account — Farmily" }] }),
  component: Signup,
});

function Signup() {
  const { signUp } = useFarmily();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("Enter your full name.");
    if (!email.includes("@")) return toast.error("Enter a valid email.");
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    if (password !== confirm) return toast.error("Passwords don't match.");
    setLoading(true);
    try {
      await signUp(fullName, email, password);
      toast.success("Account created! Add your children from the dashboard.");
      navigate({ to: "/parent" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("EMAIL_TAKEN")) {
        toast.error("An account with that email already exists.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileFrame>
      <TopBar title="Create Account" />
      <div className="px-6 pt-6 pb-10">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold">Create your account 🌱</h2>
          <p className="text-sm text-muted-foreground mt-1">You can add children after signing up.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Full Name" value={fullName} onChange={setFullName} placeholder="Jane Doe" />
          <Field label="Email" value={email} onChange={setEmail} placeholder="you@family.com" type="email" autoComplete="email" />
          <Field label="Password" value={password} onChange={setPassword} placeholder="At least 6 characters" type="password" autoComplete="new-password" />
          <Field label="Confirm Password" value={confirm} onChange={setConfirm} placeholder="Repeat password" type="password" autoComplete="new-password" />

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-2xl bg-primary text-primary-foreground py-4 font-semibold shadow-soft flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/parent/login" className="font-semibold text-primary">Sign in</Link>
        </div>
      </div>
    </MobileFrame>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1.5 w-full rounded-2xl bg-secondary px-4 py-3.5 outline-none"
      />
    </label>
  );
}

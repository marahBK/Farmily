import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { useFarmily } from "@/lib/farmily-store";
import { toast } from "sonner";
import { Mail, Lock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/parent/login")({
  head: () => ({ meta: [{ title: "Sign in — Farmily" }] }),
  component: Login,
});

function Login() {
  const { signIn, parent } = useFarmily();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in — redirect (must be in effect, not during render)
  useEffect(() => {
    if (parent) navigate({ to: "/parent" });
  }, [parent, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { toast.error("Enter a valid email."); return; }
    if (password.length < 4) { toast.error("Password is too short."); return; }
    setLoading(true);
    try {
      const ok = await signIn(email, password);
      if (ok) {
        toast.success("Welcome back!");
        navigate({ to: "/parent" });
      } else {
        toast.error("Incorrect email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileFrame>
      <TopBar title="Parent Sign In" />
      <div className="px-6 pt-6 pb-10">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold">Welcome back 👋</h2>
          <p className="text-sm text-muted-foreground mt-1">Sign in to supervise your family's farm.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</span>
            <div className="mt-1.5 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3.5">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent outline-none min-w-0"
                placeholder="you@family.com"
                autoComplete="email"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Password</span>
            <div className="mt-1.5 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3.5">
              <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none min-w-0"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-primary text-primary-foreground py-4 font-semibold shadow-soft hover:brightness-105 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          New to Farmily?{" "}
          <Link to="/parent/signup" className="font-semibold text-primary">
            Create an account
          </Link>
        </div>
      </div>
    </MobileFrame>
  );
}

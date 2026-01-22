import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { useState } from "react";

export const Route = createFileRoute("/signup")({
  component: RouteComponent,
  validateSearch: (search?: Record<string, unknown>): { redirect?: string } => {
    return {
      redirect: (search?.redirect as string) || undefined,
    };
  },
});

function RouteComponent() {
  const [loading, setLoading] = useState<string | null>(null);
  const { redirect } = Route.useSearch();
  const { data: session } = authClient.useSession();

  if (session?.user) {
    return <Navigate to="/select" />;
  }

  const handleSignup = async (provider: "github" | "google") => {
    setLoading(provider);
    await authClient.signIn.social({
      provider,
      callbackURL: redirect || "/select",
      newUserCallbackURL: redirect || "/onboarding",
    });
    setLoading(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050a14] text-gray-300 relative overflow-hidden">
      {/* Ambient backgrounds */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-electric-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyber-purple/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-8 p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 transition-all hover:border-white/20 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.1)]">
        <div className="text-center mb-12">
          <Link to="/" className="flex items-center justify-center gap-3 mb-8 group">
            <div className="relative">
              <div className="absolute -inset-2 bg-electric-blue/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src="/logo-padlock.png" alt="KoreShield Logo" className="w-12 relative z-10" />
            </div>
            <p className="font-bold text-white text-3xl tracking-tight">
              KoreShield
            </p>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-3">
            Create an account
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            Sign up to get started with KoreShield
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleSignup("github")}
            disabled={loading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading === "github" ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-electric-blue" />
            ) : (
              <FaGithub className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
            )}
            Continue with GitHub
          </button>

          <button
            onClick={() => handleSignup("google")}
            disabled={loading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading === "google" ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-electric-blue" />
            ) : (
              <FaGoogle className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
            )}
            Continue with Google
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-8 font-medium">
          By continuing, you agree to KoreShield's{" "}
          <a href="/terms" className="text-electric-blue hover:text-blue-400 underline decoration-blue-500/30 underline-offset-4">Terms of Service</a> and{" "}
          <a href="/privacy" className="text-electric-blue hover:text-blue-400 underline decoration-blue-500/30 underline-offset-4">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

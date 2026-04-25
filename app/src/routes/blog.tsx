import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/blog")({
  component: Blog,
});

function Blog() {
  // For now, redirect to docs or show a coming soon page
  // You can replace this with actual blog implementation later
  return (
    <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src="/logo-padlock.png" alt="KoreShield Logo" className="w-12" />
          <span className="font-bold text-white text-2xl tracking-tight">
            KoreShield
          </span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Blog Coming Soon</h1>
        <p className="text-lg text-gray-400 mb-8">
          We're working on bringing you the latest insights, tutorials, and updates about LLM security.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/"
            className="px-6 py-3 bg-electric-blue text-white rounded-lg font-medium hover:bg-electric-blue/90 transition-all"
          >
            Go Home
          </a>
          <a
            href="/docs"
            className="px-6 py-3 bg-white/5 text-white border border-white/10 rounded-lg font-medium hover:bg-white/10 transition-all"
          >
            Read Docs
          </a>
        </div>
      </div>
    </div>
  );
}

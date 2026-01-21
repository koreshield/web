import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check, Download, Key, Shield, Settings } from "lucide-react";

export const Route = createFileRoute("/$orgSlug/install")({
  component: Install,
});

function Install() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Get Started with KoreShield
        </h1>
        <p className="text-gray-400 text-lg">
          Follow these simple steps to secure your LLM integrations with KoreShield.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Step 1: Install */}
        <div className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/5 p-8 backdrop-blur-sm transition-all hover:bg-white/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Download size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
                <span className="text-xl font-bold">1</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Install KoreShield</h2>
            </div>
            <p className="text-gray-400 mb-6 max-w-xl">
              Install KoreShield using pip. This will give you the command-line tool to configure and run the security proxy.
            </p>
            <div className="bg-black/50 rounded-xl border border-white/10 p-4 flex items-center justify-between group/code">
              <code className="font-mono text-accent">pip install koreshield</code>
              <button
                onClick={() =>
                  navigator.clipboard.writeText("pip install koreshield")
                }
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors opacity-0 group-hover/code:opacity-100"
              >
                <Copy size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: Configure */}
        <div className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/5 p-8 backdrop-blur-sm transition-all hover:bg-white/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Settings size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
                <span className="text-xl font-bold">2</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Configure Security</h2>
            </div>
            <p className="text-gray-400 mb-6 max-w-xl">
              Set up your security configuration. Choose your LLM provider and security level.
            </p>

            <div className="space-y-4">
              <div className="bg-black/50 rounded-xl border border-white/10 p-4 flex items-center justify-between group/code">
                <code className="font-mono text-accent">koreshield init</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("koreshield init");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors opacity-0 group-hover/code:opacity-100"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Start Proxy */}
        <div className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/5 p-8 backdrop-blur-sm transition-all hover:bg-white/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <Shield size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
                <span className="text-xl font-bold">3</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Start Security Proxy</h2>
            </div>
            <p className="text-gray-400 mb-6 max-w-xl">
              Launch the KoreShield proxy to protect your LLM API calls. It will run on localhost:8000 by default.
            </p>
            <div className="bg-black/50 rounded-xl border border-white/10 p-4 flex items-center justify-between group/code">
              <code className="font-mono text-accent">koreshield start</code>
              <button
                onClick={() => navigator.clipboard.writeText("koreshield start")}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors opacity-0 group-hover/code:opacity-100"
              >
                <Copy size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

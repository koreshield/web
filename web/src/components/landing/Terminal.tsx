import { useEffect, useState } from "react";

const SAMPLE_LOGS = [
  { method: "POST", path: "/v1/chat/completions", status: "SAFE", time: "45ms" },
  { method: "POST", path: "/v1/chat/completions", status: "BLOCKED", time: "12ms" },
  { method: "GET", path: "/health", status: "OK", time: "5ms" },
  { method: "POST", path: "/v1/chat/completions", status: "SAFE", time: "67ms" },
  { method: "POST", path: "/v1/chat/completions", status: "WARN", time: "23ms" },
  { method: "GET", path: "/status", status: "OK", time: "8ms" },
  { method: "POST", path: "/v1/chat/completions", status: "SAFE", time: "89ms" },
  { method: "POST", path: "/v1/chat/completions", status: "BLOCKED", time: "15ms" },
  { method: "GET", path: "/health", status: "OK", time: "3ms" },
  { method: "POST", path: "/v1/chat/completions", status: "SAFE", time: "56ms" },
];

export function Terminal() {
  const [text, setText] = useState("");
  const [step, setStep] = useState(0);
  const [dots, setDots] = useState("");
  const [logs, setLogs] = useState<typeof SAMPLE_LOGS>([]);

  useEffect(() => {
    const command = "docker run -p 8000:8000 koreshield/koreshield";
    if (step === 0) {
      if (text.length < command.length) {
        const timeout = setTimeout(() => {
          setText(command.slice(0, text.length + 1));
        }, 80);
        return () => clearTimeout(timeout);
      }
      const timeout = setTimeout(() => setStep(1), 300);
      return () => clearTimeout(timeout);
    }
  }, [text, step]);

  useEffect(() => {
    if (step === 1) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length < 3 ? prev + "." : ""));
      }, 150);

      const timeout = setTimeout(() => {
        setStep(2);
      }, 1500);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [step]);

  useEffect(() => {
    if (step === 2) {
      const timeout = setTimeout(() => setStep(3), 600);
      return () => clearTimeout(timeout);
    }
  }, [step]);

  useEffect(() => {
    if (step === 3) {
      const startTimeout = setTimeout(() => {
        const interval = setInterval(() => {
          const randomLog =
            SAMPLE_LOGS[Math.floor(Math.random() * SAMPLE_LOGS.length)];
          setLogs((prev) => [...prev.slice(-7), randomLog]);
        }, 1200);
        return () => clearInterval(interval);
      }, 1000);

      return () => clearTimeout(startTimeout);
    }
  }, [step]);

  return (
    <div className="w-full bg-[#0c0c0c] rounded-xl border border-white/10 shadow-2xl overflow-hidden font-mono text-sm md:text-base text-gray-300 pointer-events-auto min-h-125 flex flex-col">
      <div className="bg-white/5 border-b border-white/5 px-4 py-3 flex items-center gap-4">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
        <div className="text-xs text-white/40 font-medium flex-1 text-center mr-16">
          user@koreshield
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-2 flex-1 overflow-y-auto">
        <p>
          <span className="text-green-400">➜</span>{" "}
          <span className="text-blue-400">~</span> {text}
          {step === 0 && (
            <span className="animate-pulse text-green-400 block w-2.5 h-5 bg-green-400/50 align-middle ml-1"></span>
          )}
        </p>

        {step >= 1 && (
          <p className="text-cyan-400">
            Initializing KoreShield v0.1.1{step === 1 ? dots : "..."}
          </p>
        )}

        {step >= 2 && (
          <p className="text-green-400">Server running at http://0.0.0.0:8000</p>
        )}

        {step >= 3 && (
          <div className="space-y-2">
            <p className="text-fuchsia-400">
              Ready to accept connections.
            </p>
            <p className="text-yellow-400">
              Monitoring active...
            </p>
            <div className="pt-4 space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3 text-xs md:text-sm">
                  <span className="text-white/50 w-16">{log.method}</span>
                  <span className="text-white/80 flex-1">{log.path}</span>
                  <span
                    className={
                      log.status === "BLOCKED"
                        ? "text-red-400"
                        : log.status === "WARN"
                          ? "text-yellow-400"
                          : "text-green-400"
                    }
                  >
                    {log.status}
                  </span>
                  <span className="text-white/30 w-12 text-right">
                    {log.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <span className="animate-pulse text-green-400 inline-block w-2.5 h-5 bg-green-400/50 align-middle"></span>
        )}
      </div>
    </div>
  );
}

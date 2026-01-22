import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ArrowRight, Copy, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Terminal } from "./Terminal";
import { BeamGroup } from "./beam-group";

export const Hero = () => {
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText("pip install koreshield");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden pt-20">
      <div className="absolute inset-0 z-0">
        {/* Background Gradient Mesh - Inverted Positions */}
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-electric-blue/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyber-purple/5 rounded-full blur-[120px] animate-pulse [animation-delay:1s]" />

        <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
          <color attach="background" args={["#050a14"]} />
          <fog attach="fog" args={["#050a14", 5, 20]} />
          {/* Rotated 180 degrees to point Up (default is Down) */}
          <BeamGroup position={[0, -5, -5]} rotation={[0, 0, Math.PI]} />
        </Canvas>
      </div>

      <div className="flex flex-col gap-8 max-w-5xl mx-auto px-6 relative z-10 w-full items-center">
        <div className="flex flex-col gap-6 items-center mt-20">
          <a
            href="https://github.com/koreshield/koreshield"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/60 backdrop-blur-md hover:bg-white/10 hover:border-electric-blue/30 hover:text-white transition-all duration-300 animate-fade-in group"
          >
            <span className="w-2 h-2 rounded-full bg-security-green animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="font-mono">v0.1.0 Public Beta</span>
            <span className="w-px h-3 bg-white/10 mx-1" />
            <span className="group-hover:text-electric-blue transition-colors">Open Source Security</span>
          </a>

          <h1 className="text-5xl md:text-8xl font-bold text-center tracking-tight leading-[1.05] animate-fade-in [animation-delay:200ms]">
            Protect your AI <br />
            <span className="text-gradient drop-shadow-lg">
              from Prompt Injection
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-center text-white/60 max-w-2xl leading-relaxed animate-fade-in [animation-delay:400ms]">
            The open-source middleware to detect attacks, enforce policies, and audit LLM interactions in real-time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 w-full justify-center animate-fade-in [animation-delay:600ms]">
          <Link
            to="/docs/$"
            className="w-full sm:w-auto px-8 py-4 bg-electric-blue text-white rounded-xl font-bold text-lg transition-all hover:bg-electric-blue/90 hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2"
          >
            Get Started <ArrowRight size={20} />
          </Link>
          <button
            onClick={copyCommand}
            className="w-full sm:w-auto flex items-center gap-3 text-white/70 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 font-mono text-sm backdrop-blur-sm transition-all group cursor-pointer hover:border-white/20"
          >
            <span className="text-electric-blue font-bold">$</span> pip install koreshield
            {copied ? (
              <Check size={16} className="text-security-green" />
            ) : (
              <Copy
                size={16}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/50"
              />
            )}
          </button>
        </div>

        <div className="w-full max-w-4xl mt-12 pointer-events-auto">
          <Terminal />
        </div>
      </div>
    </div>
  );
};

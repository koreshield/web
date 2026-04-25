import { Navbar } from "./navbar";
import { DeveloperExperience } from "./developer-experience";
import { NetworkDiagram } from "./network-diagram";
import { BringYourOwnDomain } from "./bring-your-own-domain";
import { MultipleProtocols } from "./multiple-protocols";
import { OpenSource } from "./opensource";
import { Hero } from "./hero";

export const Landing = () => {
  return (
    <>
      <div className="min-h-screen text-fd-foreground selection:bg-electric-blue/30">
        <Navbar />

        <Hero />

        <div className="py-24 border-white/5">
          <DeveloperExperience />
        </div>

        <div className="py-24">
          <NetworkDiagram />
        </div>

        <div className="py-24">
          <BringYourOwnDomain />
        </div>

        <div className="py-24">
          <MultipleProtocols />
        </div>

        <div className="py-24">
          <OpenSource />
        </div>

        <footer className="border-t border-white/10 py-8 md:py-12 bg-[#050a14]">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm md:text-base">KoreShield</span>
            </div>
            <div className="text-white/40 text-xs md:text-sm text-center">
              © {new Date().getFullYear()} KoreShield. All rights reserved.
            </div>
            <div className="flex gap-4 md:gap-6 text-white/60 text-sm">
              <a
                href="https://twitter.com/koreshield"
                target="_blank"
                className="hover:text-white transition-colors"
              >
                Twitter
              </a>
              <a
                href="https://github.com/koreshield/koreshield"
                target="_blank"
                className="hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

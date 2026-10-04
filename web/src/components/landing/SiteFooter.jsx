import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-black text-sm tracking-widest text-white">JC APEX</span>
          </div>
          <p className="text-[11px] font-mono text-white/30 leading-relaxed">
            Real-time telemetry, strategy, and pit-to-driver command intelligence for electric endurance racing.
          </p>
        </div>

        <div>
          <div className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase mb-3">Platform</div>
          <ul className="space-y-2 text-[11px] font-mono">
            <li><Link to="/pit" className="text-white/50 hover:text-primary transition-colors">Pit Center</Link></li>
            <li><Link to="/driver" className="text-white/50 hover:text-primary transition-colors">Driver HUD</Link></li>
            <li><Link to="/lap-timing" className="text-white/50 hover:text-primary transition-colors">Lap Timing</Link></li>
            <li><Link to="/telemetry-dashboard" className="text-white/50 hover:text-primary transition-colors">Telemetry Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-[9px] font-display font-bold tracking-widest text-white/40 uppercase mb-3">Company</div>
          <ul className="space-y-2 text-[11px] font-mono">
            <li><Link to="/about" className="text-white/50 hover:text-primary transition-colors">About</Link></li>
            <li><Link to="/contact" className="text-white/50 hover:text-primary transition-colors">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.04] py-4 text-center text-[9px] font-mono text-white/20 tracking-widest">
        © {new Date().getFullYear()} JC APEX RACING INTELLIGENCE
      </div>
    </footer>
  );
}
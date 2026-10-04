import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Cpu, Shield, Zap } from 'lucide-react';

const proofPoints = [
  { icon: Cpu, text: 'Fully operational Command Center' },
  { icon: Shield, text: 'Oracle Core live with real predictions' },
  { icon: Zap, text: 'Live telemetry — no placeholder data' },
];

export default function FinalCTA() {
  return (
    <section className="relative py-32 px-4 border-t border-border/30">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/3 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-xs font-mono tracking-[0.3em] text-primary/80 uppercase mb-6">
            Ready For Competition
          </div>

          <h2 className="text-4xl md:text-6xl font-sans font-black tracking-tight mb-4 leading-tight">
            This Isn't A Demo.
          </h2>
          <h3 className="text-2xl md:text-3xl font-sans font-bold text-muted-foreground mb-3">
            This Is Race Infrastructure.
          </h3>
          <p className="text-sm font-mono text-muted-foreground/50 max-w-xl mx-auto mb-10 leading-relaxed">
            JC APEX was built to be deployed at a real Electrathon event — not to impress judges at a science fair. 
            Every system functions. Every prediction is computed. Every command is real.
          </p>

          {/* Proof points */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            {proofPoints.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs font-mono text-muted-foreground/60">
                <Icon className="w-3.5 h-3.5 text-primary/70" />
                {text}
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/"
              className="group inline-flex items-center gap-3 px-10 py-4 bg-primary text-primary-foreground font-mono text-sm font-bold tracking-wider uppercase rounded glow-red hover:bg-primary/90 transition-all"
            >
              <Cpu className="w-4 h-4" />
              ENTER COMMAND CENTER
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* System status footer */}
          <div className="inline-flex items-center gap-6 px-6 py-3 rounded-full border border-border bg-card/30 mb-16">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground/50">ORACLE ONLINE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground/50">TELEMETRY ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground/50">COMMS LIVE</span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t border-border/40">
            <p className="text-xs font-mono text-muted-foreground/30 tracking-widest">
              JC APEX RACE INTELLIGENCE SYSTEM · v2.4.1 · BUILT FOR COMPETITION
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
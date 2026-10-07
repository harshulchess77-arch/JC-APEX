import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Shield, Cpu, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { value: '20Hz', label: 'Telemetry Rate', sub: 'sensor refresh' },
  { value: '<50ms', label: 'Command Latency', sub: 'pit-to-driver' },
  { value: '6+', label: 'Subsystems', sub: 'monitored live' },
  { value: '±0.4%', label: 'Prediction Error', sub: 'battery model' },
];

const systemLines = [
  '> APEX_OS v2.4.1 INITIALIZED',
  '> TELEMETRY STREAM ... ACTIVE',
  '> ORACLE CORE v2 ... ONLINE',
  '> PREDICTIVE ENGINE ... ARMED',
  '> ALL 6 SUBSYSTEMS NOMINAL ✓',
];

export default function HeroSection() {
  const [bootLines, setBootLines] = useState([]);

  useEffect(() => {
    systemLines.forEach((line, i) => {
      setTimeout(() => {
        setBootLines(prev => [...prev, line]);
      }, 600 + i * 400);
    });
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center grid-bg overflow-hidden">
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-primary/20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-primary/20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-primary/10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-primary/10 pointer-events-none" />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/4 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-primary/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Top nav bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-red" />
          <span className="text-xs font-mono tracking-[0.3em] text-muted-foreground/60 uppercase">JC APEX RACE INTELLIGENCE</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          {['SYSTEM', 'ORACLE', 'TELEMETRY', 'STRATEGY'].map(item => (
            <span key={item} className="text-xs font-mono text-muted-foreground/40 tracking-widest hover:text-muted-foreground cursor-pointer transition-colors">{item}</span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/40">
          <Wifi className="w-3 h-3" />
          <span>v2.4.1</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center px-4 max-w-5xl mx-auto"
      >
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 mb-10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-red" />
          <span className="text-xs font-mono tracking-[0.25em] text-primary/80 uppercase">
            Electrathon Racing Intelligence System
          </span>
          <Shield className="w-3 h-3 text-primary/60" />
        </motion.div>

        {/* Title */}
        <h1 className="font-sans font-black leading-none mb-4">
          <div className="text-6xl sm:text-8xl md:text-[10rem] tracking-tight">
            <span className="text-foreground">JC </span>
            <span className="text-[#FF1E42] drop-shadow-[0_0_30px_rgba(255,30,66,0.6)]">APEX</span>
          </div>
          <div className="text-base md:text-xl font-mono font-normal tracking-[0.5em] text-muted-foreground/50 uppercase mt-3">
            Intelligence · Precision · Control
          </div>
        </h1>

        {/* Hero copy */}
        <div className="mt-8 mb-10 space-y-2">
          <p className="text-xl md:text-2xl text-foreground/80 font-light">
            The race doesn't start when the flag drops.
          </p>
          <p className="text-xl md:text-2xl text-foreground/80 font-light">
            It starts when your <span className="text-primary font-semibold">intelligence system</span> does.
          </p>
          <p className="text-sm font-mono text-muted-foreground/50 max-w-xl mx-auto mt-4 leading-relaxed">
            JC APEX is a purpose-built race intelligence platform that fuses real-time telemetry, 
            predictive analytics, and tactical command into a single unified system. 
            Built for Electrathon. Engineered to win.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            to="/login"
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#FF1E42] text-white font-mono text-sm font-bold tracking-wider uppercase rounded hover:bg-[#E01335] transition-all shadow-[0_0_20px_rgba(255,30,66,0.4)]"
          >
            <Cpu className="w-4 h-4" />
            OPERATOR LOGIN
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/pit"
            className="inline-flex items-center gap-2 px-8 py-4 border border-[#2A2E3D] bg-black/40 text-white font-mono text-sm font-semibold tracking-wider uppercase rounded hover:bg-black/60 transition-all"
          >
            PIT CREW DASHBOARD
          </Link>
          <Link
            to="/driver"
            className="inline-flex items-center gap-2 px-8 py-4 border border-[#2A2E3D] bg-black/40 text-white font-mono text-sm font-semibold tracking-wider uppercase rounded hover:bg-black/60 transition-all"
          >
            DRIVER HUD
          </Link>
        </div>

        {/* Boot terminal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mx-auto max-w-sm bg-card/40 border border-border/60 rounded p-4 mb-10 text-left"
        >
          {bootLines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-xs font-mono mb-0.5 ${line.includes('✓') ? 'text-green-500' : 'text-muted-foreground/60'}`}
            >
              {line}
            </motion.div>
          ))}
          {bootLines.length < systemLines.length && (
            <span className="text-xs font-mono text-primary animate-pulse">▋</span>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative p-4 rounded border border-border bg-card/40 backdrop-blur-sm group hover:border-[#FF1E42]/30 transition-colors"
            >
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF1E42]/30 to-transparent" />
              <div className="text-2xl md:text-3xl font-mono font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-[10px] font-mono text-foreground/80 tracking-wider uppercase font-semibold">
                {stat.label}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground/50 mt-0.5">
                {stat.sub}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <span className="text-[10px] font-mono text-muted-foreground/30 tracking-widest uppercase">SCROLL</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground/30 animate-bounce" />
      </motion.div>
    </section>
  );
}
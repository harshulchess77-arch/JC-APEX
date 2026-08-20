import React from 'react';
import HeroSection from '../components/landing/HeroSection';
import ProblemSolution from '../components/landing/ProblemSolution';
import OracleEngine from '../components/landing/OrcaleEngine';
import FailurePrecognition from '../components/landing/FailurePrecognition';
import Capabilities from '../components/landing/Capabilities';
import StrategyAdvisor from '../components/landing/StrategyAdvisor';
import FinalCTA from '../components/landing/FinalCTA';

export default function Landing() {
  return (
    <div className="bg-background min-h-screen">
      <HeroSection />
      <ProblemSolution />
      <OracleEngine />
      <FailurePrecognition />
      <Capabilities />
      <StrategyAdvisor />
      <FinalCTA />
    </div>
  );
}
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();
  const path = location.pathname.replace('/', '');
  
  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-7xl md:text-9xl font-sans font-black text-muted-foreground/20 mb-4 tracking-tight">
          4<span className="text-primary/20">0</span>4
        </h1>
        <div className="w-16 h-0.5 bg-primary mx-auto mb-6" />
        <h2 className="text-xl font-sans font-bold mb-3">Signal Lost</h2>
        <p className="text-sm font-mono text-muted-foreground mb-8">
          Route "<span className="text-primary">{path || 'unknown'}</span>" not found in system.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-mono text-xs font-bold tracking-wider uppercase rounded hover:bg-primary/90 transition-colors"
        >
          RETURN TO BASE
        </Link>
      </div>
    </div>
  );
}
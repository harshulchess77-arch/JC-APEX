import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function LiveChart({ data, dataKey, color, label }) {
  const colorMap = {
    red: '#ef4444',
    green: '#22c55e',
    yellow: '#eab308',
    blue: '#60a5fa',
    white: '#f5f5f5',
  };
  
  const hexColor = colorMap[color] || colorMap.red;

  return (
    <div className="rounded border border-border bg-card/30 p-4">
      <div className="text-xs font-mono tracking-wider text-muted-foreground uppercase mb-3">
        {label}
      </div>
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={hexColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={hexColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                background: 'hsl(0, 0%, 7%)',
                border: '1px solid hsl(0, 0%, 15%)',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                color: '#f5f5f5',
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={hexColor}
              strokeWidth={1.5}
              fill={`url(#gradient-${dataKey})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
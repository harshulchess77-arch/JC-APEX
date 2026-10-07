import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function LiveChart({ data, dataKey, color, label }) {
  // Defensive fallbacks for rapid 5 Hz telemetry updates
  const safeData = data ?? [];
  const safeDataKey = dataKey ?? 'value';
  const safeColor = color ?? 'green';
  const safeLabel = label ?? 'Metric';

  const colorMap = {
    red: '#FF1E42',
    green: '#10B981',
    yellow: '#FFB300',
    blue: '#00E5FF',
    white: '#f5f5f5',
  };

  const hexColor = colorMap[safeColor] || colorMap.green;

  return (
    <div className="rounded border border-border bg-card/30 p-4">
      <div className="text-xs font-mono tracking-wider text-muted-foreground uppercase mb-3">
        {safeLabel}
      </div>
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={safeData}>
            <defs>
              <linearGradient id={`gradient-${safeDataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={hexColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={hexColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                background: 'hsl(215, 20%, 6%)',
                border: '1px solid hsl(215, 20%, 15%)',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                color: '#f5f5f5',
              }}
            />
            <Area
              type="monotone"
              dataKey={safeDataKey}
              stroke={hexColor}
              strokeWidth={1.5}
              fill={`url(#gradient-${safeDataKey})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
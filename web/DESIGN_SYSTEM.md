# JC-APEX Design System

## Color Tokens

### Primary Colors
- `--primary`: #FF1E42 (Crimson Red F1) - Main brand color
- `--background`: #08090C (Pitch Black Carbon)
- `--foreground`: #FFFFFF (Pure White)

### Status Colors
- `--f1-nominal-green`: #10B981 (Emerald Green)
- `--f1-signal-green`: #00E676 (Bright Green)
- `--f1-warning-gold`: #FFB300 (Racing Gold)
- `--f1-critical-red`: #FF1E42 (Crimson Red)
- `--f1-data-cyan`: #00E5FF (Electric Cyan)

### Neutral Colors
- `--f1-muted-slate`: #8A909D (Muted Slate)
- `--f1-surface-panel`: #101217 (Dark Slate Card)
- `--f1-border-subtle`: #1C1F28 (Subtle Border)

## Typography

### Font Families
- `--font-mono`: 'JetBrains Mono', monospace (Data readouts)
- `--font-sans`: 'Inter', sans-serif (Body text)
- `--font-f1`: 'Rajdhani', 'Inter', sans-serif (F1-style headings)
- `--font-display`: 'Orbitron', monospace (Display text)

### Font Weights
- Light: 300
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700
- Black: 800
- Heavy: 900

### Font Sizes
- XS: 0.625rem (10px) - Small labels
- SM: 0.75rem (12px) - Captions
- Base: 0.875rem (14px) - Body
- LG: 1rem (16px) - Medium headings
- XL: 1.125rem (18px) - Large headings
- 2XL: 1.25rem (20px) - Section titles
- 3XL: 1.5rem (24px) - Page titles

## Spacing

- XS: 0.25rem (4px)
- SM: 0.5rem (8px)
- MD: 0.75rem (12px)
- LG: 1rem (16px)
- XL: 1.5rem (24px)
- 2XL: 2rem (32px)
- 3XL: 3rem (48px)

## Border Radius

- SM: 0.25rem (4px)
- MD: 0.5rem (8px)
- LG: 0.75rem (12px)
- XL: 1rem (16px)
- Full: 9999px

## Transitions

- Fast: 150ms ease
- Base: 200ms ease
- Slow: 300ms ease

## Effects

### Glassmorphism
- `.glass` - Standard glass with blur (14px)
- `.glass-strong` - Stronger glass with blur (22px)
- `.glass-chip` - Small chip glass with blur (12px)

### Glow Effects
- `.glow-red` - Red glow for primary elements
- `.glow-red-text` - Red text glow
- `.glow-red-subtle` - Subtle red glow

### Animations
- `.animate-pulse-red` - Pulsing red animation
- `.scanline` - Scanline effect overlay

## Component Patterns

### Metric Chips
- Display: flex column
- Spacing: px-3 py-1.5
- Border: border-r border-white/5
- Font: font-display font-bold
- Size: text-xs

### Status Chips
- Display: flex items-center
- Spacing: px-2 py-0.5
- Border: rounded border
- Font: font-mono
- Size: text-[7px]

### Headers
- Height: h-10 or h-11
- Border: border-b border-white/[0.06]
- Background: bg-[#101217] glass
- Spacing: px-4 or px-5

### Panels
- Border: border border-white/[0.06]
- Background: bg-[#101217] glass
- Padding: p-3 or p-4
- Radius: rounded

## Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius-lg)',
  			md: 'var(--radius-md)',
  			sm: 'var(--radius-sm)',
  			xl: 'var(--radius-xl)',
  			'2xl': 'var(--radius-2xl)',
  			full: 'var(--radius-full)',
  		},
  		fontFamily: {
  			mono: ['var(--font-mono)'],
  			sans: ['var(--font-sans)'],
  			display: ['var(--font-display)'],
  		},
  		colors: {
  			background: 'var(--color-carbon)',
  			foreground: 'var(--color-text-primary)',
  			card: {
  				DEFAULT: 'var(--color-surface)',
  				foreground: 'var(--color-text-primary)'
  			},
  			popover: {
  				DEFAULT: 'var(--color-surface)',
  				foreground: 'var(--color-text-primary)'
  			},
  			primary: {
  				DEFAULT: 'var(--color-crimson)',
  				foreground: 'var(--color-text-primary)'
  			},
  			secondary: {
  				DEFAULT: 'var(--color-surface-elevated)',
  				foreground: 'var(--color-text-secondary)'
  			},
  			muted: {
  				DEFAULT: 'var(--color-surface)',
  				foreground: 'var(--color-text-tertiary)'
  			},
  			accent: {
  				DEFAULT: 'var(--color-crimson)',
  				foreground: 'var(--color-text-primary)'
  			},
  			destructive: {
  				DEFAULT: 'var(--color-critical)',
  				foreground: 'var(--color-text-primary)'
  			},
  			border: 'var(--color-border)',
  			input: 'var(--color-border)',
  			ring: 'var(--color-crimson)',
  			// Status colors from design tokens
  			nominal: 'var(--color-nominal)',
  			signal: 'var(--color-signal)',
  			warning: 'var(--color-warning)',
  			critical: 'var(--color-critical)',
  			data: 'var(--color-data)',
  		},
  		spacing: {
  			'1': 'var(--space-1)',
  			'2': 'var(--space-2)',
  			'3': 'var(--space-3)',
  			'4': 'var(--space-4)',
  			'5': 'var(--space-5)',
  			'6': 'var(--space-6)',
  			'8': 'var(--space-8)',
  			'10': 'var(--space-10)',
  			'12': 'var(--space-12)',
  			'16': 'var(--space-16)',
  			'20': 'var(--space-20)',
  			'24': 'var(--space-24)',
  		},
  		fontSize: {
  			xs: 'var(--text-xs)',
  			sm: 'var(--text-sm)',
  			base: 'var(--text-base)',
  			lg: 'var(--text-lg)',
  			xl: 'var(--text-xl)',
  			'2xl': 'var(--text-2xl)',
  			'3xl': 'var(--text-3xl)',
  			'4xl': 'var(--text-4xl)',
  			'5xl': 'var(--text-5xl)',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

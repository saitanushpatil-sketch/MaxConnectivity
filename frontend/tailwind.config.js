/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        max: {
          bg: '#0A0A0F',
          surface: '#12121A',
          card: '#1A1A26',
          border: '#252535',
          cyan: '#00F5FF',
          pink: '#FF006E',
          orange: '#FB5607',
          yellow: '#FFBE0B',
          purple: '#8338EC',
          blue: '#3A86FF',
          green: '#06D6A0',
          text: '#E8E8FF',
          muted: '#6B6B8A',
        }
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.2s ease',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'pulse-cyan': 'pulseCyan 2s infinite',
        'typing': 'typing 1.4s infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 }
        },
        pulseCyan: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 245, 255, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0, 245, 255, 0)' }
        },
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-6px)' }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgba(0,245,255,0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(131,56,236,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(255,0,110,0.05) 0px, transparent 50%)',
      }
    },
  },
  plugins: [],
};

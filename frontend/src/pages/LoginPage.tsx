import React from 'react';
import LoginButton from '../components/LoginButton';
import { Shield, Zap, Globe, Lock } from 'lucide-react';

const features = [
  { icon: Shield, title: 'Secure by Design', desc: 'Internet Identity authentication — no passwords, no leaks.' },
  { icon: Globe, title: 'Multi-Chain', desc: 'Manage ICP, Ethereum, Polygon, and more from one place.' },
  { icon: Zap, title: 'Lightning Fast', desc: 'Built on Internet Computer for sub-second interactions.' },
  { icon: Lock, title: 'Self-Custody', desc: 'Your keys, your crypto. Full control, always.' },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Hero background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/assets/generated/hero-bg.dim_1440x900.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Dark overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg, oklch(0.08 0.01 240 / 0.92) 0%, oklch(0.10 0.015 200 / 0.85) 50%, oklch(0.08 0.01 240 / 0.92) 100%)',
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.78 0.18 185 / 0.15) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.78 0.18 185 / 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/wallet-logo.dim_128x128.png"
            alt="NexWallet"
            className="w-10 h-10 rounded-xl object-cover"
            style={{ border: '1px solid oklch(0.78 0.18 185 / 0.4)' }}
          />
          <span className="font-bold text-xl tracking-tight" style={{ color: 'oklch(0.95 0.01 240)' }}>
            Nex<span style={{ color: 'oklch(0.78 0.18 185)' }}>Wallet</span>
          </span>
        </div>
        <LoginButton />
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full"
            style={{
              background: 'oklch(0.78 0.18 185 / 0.12)',
              border: '1px solid oklch(0.78 0.18 185 / 0.3)',
            }}>
            <div className="w-2 h-2 rounded-full animate-pulse-teal" style={{ background: 'oklch(0.78 0.18 185)' }} />
            <span className="text-sm font-medium" style={{ color: 'oklch(0.78 0.18 185)' }}>
              Powered by Internet Computer
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
            <span style={{ color: 'oklch(0.95 0.01 240)' }}>Your Web3</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, oklch(0.78 0.18 185) 0%, oklch(0.72 0.20 160) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Crypto Wallet
            </span>
          </h1>

          <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'oklch(0.65 0.02 240)' }}>
            Manage multi-chain assets, track tokens, monitor addresses, and send transactions — all secured by Internet Identity.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <LoginButton size="lg" className="px-8 py-3 text-base font-semibold rounded-xl teal-glow" />
            <a
              href="https://internetcomputer.org"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 text-base font-medium rounded-xl transition-all"
              style={{
                color: 'oklch(0.78 0.18 185)',
                border: '1px solid oklch(0.78 0.18 185 / 0.3)',
                background: 'oklch(0.78 0.18 185 / 0.05)',
              }}
            >
              Learn More →
            </a>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-5 rounded-2xl text-left transition-all hover:-translate-y-1"
                style={{
                  background: 'oklch(0.14 0.01 240 / 0.7)',
                  border: '1px solid oklch(0.28 0.015 240 / 0.6)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background: 'oklch(0.78 0.18 185 / 0.12)',
                    border: '1px solid oklch(0.78 0.18 185 / 0.25)',
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'oklch(0.78 0.18 185)' }} />
                </div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'oklch(0.90 0.01 240)' }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'oklch(0.55 0.02 240)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 px-6"
        style={{ borderTop: '1px solid oklch(0.20 0.012 240 / 0.5)' }}>
        <p className="text-sm" style={{ color: 'oklch(0.45 0.02 240)' }}>
          © {new Date().getFullYear()} NexWallet. Built with{' '}
          <span style={{ color: 'oklch(0.70 0.20 25)' }}>♥</span>{' '}using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'nexwallet')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline transition-colors"
            style={{ color: 'oklch(0.78 0.18 185)' }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import LoginButton from './LoginButton';
import {
  LayoutDashboard,
  Globe,
  Coins,
  Eye,
  Send,
  History,
  Menu,
  X,
  ChevronDown,
  BookUser,
  Shield,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/networks', label: 'Networks', icon: Globe },
  { path: '/tokens', label: 'Tokens', icon: Coins },
  { path: '/watchlist', label: 'Watchlist', icon: Eye },
  { path: '/whitelist', label: 'Whitelist', icon: BookUser },
  { path: '/send', label: 'Send', icon: Send },
  { path: '/history', label: 'History', icon: History },
  { path: '/subscription', label: 'Subscription', icon: Shield },
];

export default function Navbar() {
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const principal = identity?.getPrincipal().toString() ?? '';
  const shortPrincipal = principal ? `${principal.slice(0, 5)}...${principal.slice(-3)}` : '';
  const initials = profile?.userName
    ? profile.userName.slice(0, 2).toUpperCase()
    : shortPrincipal.slice(0, 2).toUpperCase();

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'oklch(0.12 0.01 240 / 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid oklch(0.25 0.015 240)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src="/assets/generated/wallet-logo.dim_128x128.png"
                alt="NexWallet"
                className="w-9 h-9 rounded-xl object-cover"
                style={{ border: '1px solid oklch(0.78 0.18 185 / 0.3)' }}
              />
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ boxShadow: '0 0 12px oklch(0.78 0.18 185 / 0.4)' }}
              />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: 'oklch(0.95 0.01 240)' }}>
              Nex<span style={{ color: 'oklch(0.78 0.18 185)' }}>Wallet</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {identity ? (
              <TooltipProvider>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:bg-surface-raised"
                      style={{ border: '1px solid oklch(0.28 0.015 240)' }}
                    >
                      <Avatar className="w-7 h-7">
                        <AvatarFallback
                          className="text-xs font-semibold"
                          style={{
                            background: 'oklch(0.78 0.18 185 / 0.2)',
                            color: 'oklch(0.78 0.18 185)',
                          }}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden sm:block" style={{ color: 'oklch(0.85 0.01 240)' }}>
                        {profile?.userName || shortPrincipal}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5" style={{ color: 'oklch(0.55 0.02 240)' }} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56"
                    style={{
                      background: 'oklch(0.18 0.012 240)',
                      border: '1px solid oklch(0.28 0.015 240)',
                    }}
                  >
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-foreground">{profile?.userName || 'Anonymous'}</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs truncate cursor-pointer" style={{ color: 'oklch(0.55 0.02 240)' }}>
                            {shortPrincipal}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent
                          style={{ background: 'oklch(0.20 0.012 240)', border: '1px solid oklch(0.28 0.015 240)' }}
                        >
                          <p className="text-xs font-mono">{principal}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <DropdownMenuSeparator style={{ background: 'oklch(0.25 0.015 240)' }} />
                    <DropdownMenuItem asChild>
                      <LoginButton variant="ghost" size="sm" className="w-full justify-start" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>
            ) : (
              <LoginButton />
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'oklch(0.65 0.02 240)' }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav
            className="md:hidden py-3 border-t animate-fade-in"
            style={{ borderColor: 'oklch(0.22 0.012 240)' }}
          >
            <div className="flex flex-col gap-1">
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

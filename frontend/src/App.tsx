import React from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  redirect,
  useNavigate,
  useLocation,
} from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsSubscribed, useWhitelistMigration } from './hooks/useQueries';
import Navbar from './components/Navbar';
import UserProfileSetup from './components/UserProfileSetup';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NetworksPage from './pages/NetworksPage';
import TokensPage from './pages/TokensPage';
import WatchlistPage from './pages/WatchlistPage';
import WhitelistPage from './pages/WhitelistPage';
import SendPage from './pages/SendPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import SubscriptionPage from './pages/SubscriptionPage';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

// Protected routes that require an active subscription
const PROTECTED_PATHS = ['/dashboard', '/networks', '/tokens', '/watchlist', '/whitelist', '/send', '/history'];

// ─── Layout wrapper for authenticated pages ───────────────────────────────────
function AuthLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: isSubscribed, isLoading: subscriptionLoading } = useIsSubscribed();
  const navigate = useNavigate();
  const location = useLocation();

  // Run whitelist migration once on startup
  useWhitelistMigration();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Redirect unsubscribed users away from protected routes
  useEffect(() => {
    if (!isAuthenticated) return;
    if (subscriptionLoading) return;
    const isProtected = PROTECTED_PATHS.some((p) => location.pathname.startsWith(p));
    if (isProtected && isSubscribed === false) {
      navigate({ to: '/subscription' });
    }
  }, [isAuthenticated, isSubscribed, subscriptionLoading, location.pathname, navigate]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'oklch(0.10 0.008 240)' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: 'oklch(0.78 0.18 185 / 0.2)', border: '1px solid oklch(0.78 0.18 185 / 0.4)' }}
          >
            <span className="text-xl" style={{ color: 'oklch(0.78 0.18 185)' }}>◈</span>
          </div>
          <p className="text-sm" style={{ color: 'oklch(0.55 0.02 240)' }}>Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'oklch(0.10 0.008 240)' }}>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer
        className="py-4 text-center text-xs border-t"
        style={{
          borderColor: 'oklch(0.20 0.012 240)',
          color: 'oklch(0.40 0.02 240)',
        }}
      >
        © {new Date().getFullYear()} NexWallet. Built with{' '}
        <span style={{ color: 'oklch(0.70 0.20 25)' }}>♥</span>{' '}using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'nexwallet')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          style={{ color: 'oklch(0.78 0.18 185)' }}
        >
          caffeine.ai
        </a>
      </footer>
      <UserProfileSetup open={showProfileSetup} />
    </div>
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: AuthLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
  component: () => null,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const networksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/networks',
  component: NetworksPage,
});

const tokensRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tokens',
  component: TokensPage,
});

const watchlistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/watchlist',
  component: WatchlistPage,
});

const whitelistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/whitelist',
  component: WhitelistPage,
});

const sendRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/send',
  component: SendPage,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: TransactionHistoryPage,
});

const subscriptionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/subscription',
  component: SubscriptionPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  networksRoute,
  tokensRoute,
  watchlistRoute,
  whitelistRoute,
  sendRoute,
  historyRoute,
  subscriptionRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </>
  );
}

import { lazy, Suspense } from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import { BackgroundProvider } from './contexts/BackgroundContext';
import { FocusTimerProvider } from './contexts/FocusTimerContext';
import { AuthProvider } from './contexts/AuthContext';
import { useIntegrationSync } from './hooks/useIntegrationSync';
import { useOnboarding } from './hooks/useOnboarding';
import { BackgroundOverlay } from './components/background/BackgroundOverlay';
import { PhotographerCredit } from './components/background/PhotographerCredit';
import { TopBar } from './components/layout/TopBar';
import { DockBar } from './components/links/DockBar';
import { CenterContent } from './components/layout/CenterContent';
import { BottomSection } from './components/layout/BottomSection';
import { RightSidebar } from './components/layout/RightSidebar';
import { SpotifyPlayer } from './components/spotify/SpotifyPlayer';
import { GlassFilters } from './components/GlassFilters';
import { AppLoader } from './components/AppLoader';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { SpotifyNotice } from './components/onboarding/SpotifyNotice';

// Heavy non-critical chunks - loaded after the initial paint
const SettingsPanel = lazy(() =>
  import('./components/settings/SettingsPanel').then((m) => ({ default: m.SettingsPanel })),
);
const FocusOverlay = lazy(() => import('./components/focus/FocusOverlay').then((m) => ({ default: m.FocusOverlay })));
const SearchOverlay = lazy(() =>
  import('./components/search/SearchOverlay').then((m) => ({ default: m.SearchOverlay })),
);
const TabSidebar = lazy(() => import('./components/tabs/TabSidebar').then((m) => ({ default: m.TabSidebar })));

// Dashboard is always accessible - auth is optional.
// Sign-in lives in Settings → Account tab.
function Dashboard(): React.ReactElement {
  useIntegrationSync();
  const { showOnboarding, showSpotifyNotice, completeOnboarding, dismissSpotifyNotice } = useOnboarding();

  return (
    <>
      {/* Background zoom layer - separate element so transform:scale animates smoothly */}
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div id="bg-zoom-layer" />
      <GlassFilters />
      <BackgroundOverlay />
      <AppLoader />
      {/* Each region is its own boundary: one widget throwing must not blank
          the whole new tab. Regions are absolutely placed, so they fail
          silently; the widgets inside them carry visible fallbacks. */}
      <ErrorBoundary name="Top bar" silent>
        <TopBar />
      </ErrorBoundary>
      <div className="top-dock-area">
        <ErrorBoundary name="Links" silent>
          <DockBar />
        </ErrorBoundary>
        <div className="spotify-anchor">
          <ErrorBoundary name="Spotify" silent>
            <SpotifyPlayer />
          </ErrorBoundary>
        </div>
      </div>
      <ErrorBoundary name="Center" silent>
        <CenterContent />
      </ErrorBoundary>
      <ErrorBoundary name="Quote" silent>
        <BottomSection />
      </ErrorBoundary>
      <ErrorBoundary name="Sidebar" silent>
        <RightSidebar />
      </ErrorBoundary>
      <ErrorBoundary name="Settings" silent>
        <Suspense>
          <SettingsPanel />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary name="Overlays" silent>
        <Suspense>
          <FocusOverlay />
          <SearchOverlay />
          <TabSidebar />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary name="Photo credit" silent>
        <PhotographerCredit />
      </ErrorBoundary>

      {showOnboarding && <OnboardingModal onComplete={completeOnboarding} />}
      {showSpotifyNotice && <SpotifyNotice onDismiss={dismissSpotifyNotice} />}
    </>
  );
}

export function App(): React.ReactElement {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BackgroundProvider>
          <FocusTimerProvider>
            <Dashboard />
          </FocusTimerProvider>
        </BackgroundProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

import { lazy, Suspense } from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import { BackgroundProvider } from './contexts/BackgroundContext';
import { FocusTimerProvider } from './contexts/FocusTimerContext';
import { AuthProvider } from './contexts/AuthContext';
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

// Heavy non-critical chunks — loaded after the initial paint
const SettingsPanel  = lazy(() => import('./components/settings/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const FocusOverlay   = lazy(() => import('./components/focus/FocusOverlay').then(m => ({ default: m.FocusOverlay })));
const SearchOverlay  = lazy(() => import('./components/search/SearchOverlay').then(m => ({ default: m.SearchOverlay })));
const TabSidebar     = lazy(() => import('./components/tabs/TabSidebar').then(m => ({ default: m.TabSidebar })));

// Dashboard is always accessible — auth is optional.
// Sign-in lives in Settings → Account tab.
function Dashboard() {
  return (
    <>
      {/* Background zoom layer — separate element so transform:scale animates smoothly */}
      <div id="bg-zoom-layer" />
      <GlassFilters />
      <BackgroundOverlay />
      <AppLoader />
      <TopBar />
      <DockBar />
      <CenterContent />
      <BottomSection />
      <SpotifyPlayer />
      <RightSidebar />
      <Suspense>
        <SettingsPanel />
        <FocusOverlay />
        <SearchOverlay />
        <TabSidebar />
      </Suspense>
      <PhotographerCredit />
    </>
  );
}

export function App() {
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

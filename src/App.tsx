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
import { SettingsPanel } from './components/settings/SettingsPanel';
import { FocusOverlay } from './components/focus/FocusOverlay';
import { GlassFilters } from './components/GlassFilters';
import { SearchOverlay } from './components/search/SearchOverlay';
import { TabSidebar } from './components/tabs/TabSidebar';

// Dashboard is always accessible — auth is optional.
// Sign-in lives in Settings → Account tab.
function Dashboard() {
  return (
    <>
      {/* Background zoom layer — separate element so transform:scale animates smoothly */}
      <div id="bg-zoom-layer" />
      <GlassFilters />
      <BackgroundOverlay />
      <TopBar />
      <DockBar />
      <CenterContent />
      <BottomSection />
      <RightSidebar />
      <SettingsPanel />
      <FocusOverlay />
      <SearchOverlay />
      <TabSidebar />
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

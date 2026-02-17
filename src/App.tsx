import { SettingsProvider } from './contexts/SettingsContext';
import { BackgroundProvider } from './contexts/BackgroundContext';
import { FocusTimerProvider } from './contexts/FocusTimerContext';
import { BackgroundOverlay } from './components/background/BackgroundOverlay';
import { PhotographerCredit } from './components/background/PhotographerCredit';
import { TopBar } from './components/layout/TopBar';
import { DockBar } from './components/links/DockBar';
import { CenterContent } from './components/layout/CenterContent';
import { BottomSection } from './components/layout/BottomSection';
import { RightSidebar } from './components/layout/RightSidebar';
import { SettingsButton } from './components/settings/SettingsButton';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { FocusOverlay } from './components/focus/FocusOverlay';

export function App() {
  return (
    <SettingsProvider>
      <BackgroundProvider>
        <FocusTimerProvider>
          <BackgroundOverlay />
          <TopBar />
          <DockBar />
          <SettingsButton />
          <CenterContent />
          <BottomSection />
          <RightSidebar />
          <SettingsPanel />
          <FocusOverlay />
          <PhotographerCredit />
        </FocusTimerProvider>
      </BackgroundProvider>
    </SettingsProvider>
  );
}

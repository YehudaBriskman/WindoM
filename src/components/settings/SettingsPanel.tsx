import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { SettingsNav, type SettingsTab } from './SettingsNav';
import { SettingsMessage } from './SettingsMessage';
import { GeneralSettings } from './sections/GeneralSettings';
import { ClockSettings } from './sections/ClockSettings';
import { BackgroundSettings } from './sections/BackgroundSettings';
import { WeatherSettings } from './sections/WeatherSettings';
import { QuotesSettings } from './sections/QuotesSettings';
import { LinksSettings } from './sections/LinksSettings';
import { PhotosSettings } from './sections/PhotosSettings';

export function SettingsPanel() {
  const { reset } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Listen for toggle event from SettingsButton
  useEffect(() => {
    const handler = () => {
      setIsOpen((prev) => {
        if (!prev) setActiveTab('general');
        return !prev;
      });
    };
    document.addEventListener('toggle-settings', handler);
    return () => document.removeEventListener('toggle-settings', handler);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const handleReset = useCallback(async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) return;
    await reset();
    setTimeout(() => window.location.reload(), 500);
  }, [reset]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`settings-backdrop ${isOpen ? 'visible' : 'hidden'}`}
        onClick={close}
      />

      {/* Panel */}
      <div
        className={`settings-panel glass-settings ${isOpen ? 'open' : 'closed'}`}
      >
        <SettingsNav active={activeTab} onChange={setActiveTab} />

        <div className="settings-main">
          {/* Header */}
          <div className="settings-header">
            <h2>Settings</h2>
            <span onClick={close} className="settings-close">
              <X size={18} />
            </span>
          </div>

          {/* Body */}
          <div className="settings-body">
            <SettingsMessage />

            {activeTab === 'general' && <GeneralSettings onReset={handleReset} />}
            {activeTab === 'clock' && <ClockSettings />}
            {activeTab === 'background' && <BackgroundSettings />}
            {activeTab === 'weather' && <WeatherSettings />}
            {activeTab === 'quotes' && <QuotesSettings />}
            {activeTab === 'links' && <LinksSettings />}
            {activeTab === 'photos' && <PhotosSettings />}
          </div>
        </div>
      </div>
    </>
  );
}

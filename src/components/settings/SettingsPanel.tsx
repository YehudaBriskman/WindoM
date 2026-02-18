import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { SettingsNav, type SettingsTab } from './SettingsNav';
import { SettingsMessage, showSettingsMessage } from './SettingsMessage';
import { GeneralSettings } from './sections/GeneralSettings';
import { BackgroundSettings } from './sections/BackgroundSettings';
import { WeatherSettings } from './sections/WeatherSettings';
import { QuotesSettings } from './sections/QuotesSettings';
import { LinksSettings } from './sections/LinksSettings';
import { PhotosSettings } from './sections/PhotosSettings';
import type { Settings } from '../../types/settings';

export function SettingsPanel() {
  const { settings, updateMultiple, reset } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const formRef = useRef<Record<string, string | boolean>>({});

  // Listen for toggle event from SettingsButton
  useEffect(() => {
    const handler = () => {
      setIsOpen((prev) => {
        if (!prev) {
          // Opening: reset form ref with current settings
          formRef.current = {};
          setActiveTab('general');
        }
        return !prev;
      });
    };
    document.addEventListener('toggle-settings', handler);
    return () => document.removeEventListener('toggle-settings', handler);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const handleSave = useCallback(async () => {
    const updates: Partial<Settings> = {};

    // Collect form values, falling back to current settings
    const str = (key: keyof Settings) =>
      (formRef.current[key] as string | undefined)?.trim?.() ?? (settings[key] as string);
    const bool = (key: keyof Settings) =>
      formRef.current[key] !== undefined ? formRef.current[key] as boolean : (settings[key] as boolean);

    updates.userName = str('userName') || 'Friend';
    updates.timeFormat = str('timeFormat') as Settings['timeFormat'];
    updates.temperatureUnit = str('temperatureUnit') as Settings['temperatureUnit'];
    updates.backgroundSource = str('backgroundSource') as Settings['backgroundSource'];
    updates.unsplashApiKey = str('unsplashApiKey');
    updates.unsplashCollectionId = str('unsplashCollectionId');
    updates.location = str('location');
    updates.weatherApiKey = str('weatherApiKey');
    updates.quotesEnabled = bool('quotesEnabled');
    updates.quoteSource = str('quoteSource') as Settings['quoteSource'];
    updates.showWeather = bool('showWeather');
    updates.showLinks = bool('showLinks');
    updates.showFocus = bool('showFocus');
    updates.showGreeting = bool('showGreeting');

    await updateMultiple(updates);
    showSettingsMessage('Settings saved successfully!', 'success');
    setTimeout(close, 1000);
  }, [settings, updateMultiple, close]);

  const handleReset = useCallback(async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) return;
    await reset();
    showSettingsMessage('Settings reset to defaults', 'success');
    setTimeout(() => window.location.reload(), 1500);
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

            {activeTab === 'general' && <GeneralSettings formRef={formRef} />}
            {activeTab === 'background' && <BackgroundSettings formRef={formRef} />}
            {activeTab === 'weather' && <WeatherSettings formRef={formRef} />}
            {activeTab === 'quotes' && <QuotesSettings formRef={formRef} />}
            {activeTab === 'links' && <LinksSettings />}
            {activeTab === 'photos' && <PhotosSettings />}

            {/* Actions */}
            <div className="settings-actions">
              <button onClick={handleSave} className="settings-save-btn">
                Save Settings
              </button>
              <button onClick={handleReset} className="settings-reset-btn">
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

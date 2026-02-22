import { useState, useEffect, useCallback } from "react";
import { Settings, X } from "lucide-react";
import { useSettings } from "../../contexts/SettingsContext";
import { SettingsNav, type SettingsTab } from "./SettingsNav";
import { SettingsMessage } from "./SettingsMessage";
import { GeneralSettings } from "./sections/GeneralSettings";
import { ClockSettings } from "./sections/ClockSettings";
import { BackgroundSettings } from "./sections/BackgroundSettings";
import { WeatherSettings } from "./sections/WeatherSettings";
import { QuotesSettings } from "./sections/QuotesSettings";
import { LinksSettings } from "./sections/LinksSettings";
import { PhotosSettings } from "./sections/PhotosSettings";
import { AccountSettings } from "./sections/AccountSettings";

export function SettingsPanel() {
  const { reset } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  // Listen for toggle event from SettingsButton
  useEffect(() => {
    const toggleHandler = () => {
      setIsOpen((prev) => {
        if (!prev) setActiveTab("general");
        return !prev;
      });
    };
    const closeHandler = () => setIsOpen(false);
    const accountHandler = () => {
      setActiveTab("account");
      setIsOpen(true);
    };
    document.addEventListener("toggle-settings", toggleHandler);
    document.addEventListener("close-settings", closeHandler);
    document.addEventListener("open-settings-account", accountHandler);
    return () => {
      document.removeEventListener("toggle-settings", toggleHandler);
      document.removeEventListener("close-settings", closeHandler);
      document.removeEventListener("open-settings-account", accountHandler);
    };
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const handleReset = useCallback(async () => {
    if (
      !confirm(
        "Are you sure you want to reset all settings to defaults? This cannot be undone.",
      )
    )
      return;
    await reset();
    setTimeout(() => window.location.reload(), 500);
  }, [reset]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`settings-backdrop ${isOpen ? "visible" : "hidden"}`}
        onClick={close}
      />

      <div
      className={`settings-btn glass-panel${isOpen ? " open" : ""}`}
      onClick={() => document.dispatchEvent(new CustomEvent('toggle-settings'))}
    >
      <Settings size={20} />
    </div>

      {/* Panel */}
      <div
        className={`settings-panel glass-settings ${isOpen ? "open" : "closed"}`}
      >
        <SettingsNav active={activeTab} onChange={setActiveTab} />

        <div className="settings-main">
          {/* Body */}
          <div className="settings-body">
            <SettingsMessage />

            {activeTab === "general" && (
              <GeneralSettings onReset={handleReset} />
            )}
            {activeTab === "clock" && <ClockSettings />}
            {activeTab === "background" && <BackgroundSettings />}
            {activeTab === "weather" && <WeatherSettings />}
            {activeTab === "quotes" && <QuotesSettings />}
            {activeTab === "links" && <LinksSettings />}
            {activeTab === "photos" && <PhotosSettings />}
            {activeTab === "account" && <AccountSettings />}
          </div>
        </div>
        <span onClick={close} className="settings-close settings-btn">
          <X size={18} />
        </span>
      </div>
    </>
  );
}

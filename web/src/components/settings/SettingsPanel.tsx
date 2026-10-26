import { useState, useEffect, useCallback } from "react";
import { Settings } from "lucide-react";
import { useSettings } from "../../contexts/SettingsContext";
import { SETTINGS_EVENT } from "../../lib/settings-events";
import { SettingsNav, type SettingsTab } from "./SettingsNav";
import { SettingsMessage } from "./SettingsMessage";
import { GeneralSettings } from "./sections/GeneralSettings";
import { ClockSettings } from "./sections/ClockSettings";
import { BackgroundSettings } from "./sections/BackgroundSettings";
import { WeatherSettings } from "./sections/WeatherSettings";
import { QuotesSettings } from "./sections/QuotesSettings";
import { LinksSettings } from "./sections/LinksSettings";
import { AppHub, type AppId } from "./sections/AppHub";
import { AppCenterPanel } from "./sections/AppCenterPanel";
import { TemplatesGallery } from "./sections/TemplatesGallery";
import { AccountSettings } from "./sections/AccountSettings";
import { useLiquidGlass } from '../../hooks/useLiquidGlass';
import { shouldDismissPanel } from '../../lib/panel-dismissal';

export function SettingsPanel() {
  const glassRef = useLiquidGlass<HTMLDivElement>('panel');
  const { reset } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [openAppId, setOpenAppId] = useState<AppId | null>(null);

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
    document.addEventListener(SETTINGS_EVENT.TOGGLE, toggleHandler);
    document.addEventListener(SETTINGS_EVENT.CLOSE, closeHandler);
    document.addEventListener(SETTINGS_EVENT.OPEN_ACCOUNT, accountHandler);
    return () => {
      document.removeEventListener(SETTINGS_EVENT.TOGGLE, toggleHandler);
      document.removeEventListener(SETTINGS_EVENT.CLOSE, closeHandler);
      document.removeEventListener(SETTINGS_EVENT.OPEN_ACCOUNT, accountHandler);
    };
  }, []);

  /**
   * Dismissal, now that the panel has no close button and no backdrop.
   *
   * The backdrop used to be the click-outside: a full-screen element under the
   * panel catching every stray click. Removing it for an element anchored in a
   * corner means the panel needs to listen for itself.
   *
   * Escape is not optional here. With the X gone, a keyboard user who opened
   * this panel would otherwise have no way out of it at all.
   */
  useEffect(() => {
    if (!isOpen) return;

    // The app centre is a sibling of this panel rather than a child, so a click
    // on the Connect button for an integration used to land "outside" and
    // dismiss the panel underneath it - taking the component driving the OAuth
    // call with it. shouldDismissPanel owns that distinction.
    const onPointerDown = (event: MouseEvent) => {
      if (shouldDismissPanel(event.target as Node | null, glassRef.current)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Escape dismisses the topmost thing, which is the app centre when one is
      // open - closing the panel out from under it would take both at once.
      if (openAppId) {
        setOpenAppId(null);
        return;
      }
      setIsOpen(false);
    };

    // `mousedown` rather than `click`: a click whose target React unmounts
    // mid-gesture - deleting a row, switching a tab - fails the `contains`
    // check afterwards and would close the panel as a side effect.
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, glassRef, openAppId]);

  const closeApp = useCallback(() => setOpenAppId(null), []);

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

      {/* Single container: gear button when collapsed, full panel when expanded */}
      <div
        ref={glassRef}
        className={`settings-container glass-panel${isOpen ? " open" : ""}`}
        onClick={!isOpen ? () => setIsOpen(true) : undefined}
      >
        {/* Collapsed state: gear icon - direct child so it's always visible */}
        <div className="settings-icon">
          <Settings size={20} />
        </div>

        {/* Expanded state: full panel content */}
        <div className="settings-inner">
          <SettingsNav active={activeTab} onChange={setActiveTab} />
          <div className="settings-main">
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
              {activeTab === "apps" && (
                <AppHub onOpenApp={setOpenAppId} />
              )}
              {activeTab === "templates" && <TemplatesGallery />}
              {activeTab === "account" && <AccountSettings />}
            </div>
          </div>
        </div>
      </div>

      {/* App center panel - centered overlay above settings */}
      {openAppId && (
        <AppCenterPanel appId={openAppId} onClose={closeApp} />
      )}
    </>
  );
}

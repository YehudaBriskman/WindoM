import { useRef, useEffect } from "react";
import { LayoutList } from "lucide-react";
import { useSidebar } from "../../hooks/useSidebar";
import { useSettings } from "../../contexts/SettingsContext";
import { TodoSection } from "../sidebar/TodoSection";
import { CalendarSection } from "../sidebar/CalendarSection";
import { SpotifyTopTracks } from "../spotify/SpotifyTopTracks";
import { HistorySection } from "../sidebar/HistorySection";
import { GmailWidget } from "../gmail/GmailWidget";
import { GitHubWidget } from "../github/GitHubWidget";
import { useLiquidGlass } from '../../hooks/useLiquidGlass';

export function RightSidebar() {

  const { isOpen, toggle, close } = useSidebar();
  const { settings } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  useLiquidGlass<HTMLDivElement>('panel', containerRef);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    // Escape, because with the close button gone this is the only way out for
    // anyone not using a mouse.
    function handleKey(e: KeyboardEvent) {
      if (isOpen && e.key === "Escape") close();
    }
    // `mousedown` rather than `click`: a click whose target React unmounts
    // mid-gesture - deleting a todo, say - fails the `contains` check when it
    // finally fires, and the sidebar closed itself as a side effect.
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, close]);

  return (
    <div
      ref={containerRef}
      className={`sidebar-container glass-panel ${isOpen ? "open" : ""}`}
      onClick={!isOpen ? (e) => { e.stopPropagation(); toggle(); } : undefined}
    >
      <div className="sidebar-btn-icon">
        <LayoutList size={20} />
      </div>

      <div className="sidebar-panel-content">
        <div className="sidebar-content">
          {settings.general.showHistory && <HistorySection />}
          {settings.general.showTodo && <TodoSection />}
          <CalendarSection />
          {settings.integrations.spotify.connected && settings.integrations.spotify.showTopTracks && <SpotifyTopTracks />}
          <GmailWidget />
          <GitHubWidget />
        </div>
      </div>
    </div>
  );
}

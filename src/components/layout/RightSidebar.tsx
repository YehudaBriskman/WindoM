import { useRef, useEffect } from "react";
import { LayoutList, X } from "lucide-react";
import { useSidebar } from "../../hooks/useSidebar";
import { TodoSection } from "../sidebar/TodoSection";
import { CalendarSection } from "../sidebar/CalendarSection";

export function RightSidebar() {
  const { isOpen, toggle, close } = useSidebar();
  const containerRef = useRef<HTMLDivElement>(null);

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
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isOpen, close]);

  return (
    <div
      ref={containerRef}
      className={`sidebar-container glass-panel ${isOpen ? "open" : ""}`}
      onClick={!isOpen ? (e) => { e.stopPropagation(); toggle(); } : undefined}
    >
      {/* Collapsed: icon */}
      <div className="sidebar-btn-icon">
        <LayoutList size={20} />
      </div>

      {/* Expanded: sidebar content */}
      <div className="sidebar-panel-content">
        <div
          onClick={(e) => { e.stopPropagation(); close(); }}
          className="sidebar-close-btn"
        >
          <X size={18} />
        </div>
        <div className="sidebar-content">
          <TodoSection />
          <CalendarSection />
        </div>
      </div>
    </div>
  );
}

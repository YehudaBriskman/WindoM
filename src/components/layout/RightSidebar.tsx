import { useRef, useEffect } from 'react';
import { LayoutList } from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import { TodoSection } from '../sidebar/TodoSection';
import { CalendarSection } from '../sidebar/CalendarSection';

export function RightSidebar() {
  const { isOpen, toggle, close } = useSidebar();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen, close]);

  return (
    <>
      {/* Toggle button is a sibling — outside the sidebar to avoid overflow clipping */}
      <div
        onClick={(e) => { e.stopPropagation(); toggle(); }}
        className={`sidebar-toggle glass-panel ${isOpen ? 'open' : ''}`}
      >
        <LayoutList size={20} />
      </div>

      <div
        ref={sidebarRef}
        className={`right-sidebar glass-sidebar ${isOpen ? 'open' : 'closed'}`}
      >
        <div className="sidebar-content">
          <TodoSection />
          <CalendarSection />
        </div>
      </div>
    </>
  );
}

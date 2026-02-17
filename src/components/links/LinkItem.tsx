import { useState } from 'react';
import * as icons from 'lucide-react';
import { getFaviconUrl } from '../../utils/url';
import type { QuickLink } from '../../types/settings';

/** Resolve a Lucide icon by name string at runtime */
function resolveLucideIcon(name: string): icons.LucideIcon | null {
  // Convert kebab-case to PascalCase: "cloud-rain" → "CloudRain"
  const pascal = name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  const icon = (icons as Record<string, unknown>)[pascal];
  return typeof icon === 'function' ? (icon as icons.LucideIcon) : null;
}

export function LinkItem({ link }: { link: QuickLink }) {
  const [faviconError, setFaviconError] = useState(false);

  const renderIcon = () => {
    if (link.icon?.trim()) {
      const Icon = resolveLucideIcon(link.icon.trim());
      if (Icon) return <Icon size={18} />;
      // Not a lucide icon — treat as emoji text
      return <span>{link.icon}</span>;
    }
    // Fallback to favicon
    if (!faviconError) {
      return (
        <img
          src={getFaviconUrl(link.url)}
          alt=""
          className="link-item-favicon"
          onError={() => setFaviconError(true)}
        />
      );
    }
    // Final fallback
    const LinkIcon = icons.Link;
    return <LinkIcon size={16} />;
  };

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-item glass-panel"
    >
      <span className="link-item-icon">{renderIcon()}</span>
      <span>{link.name}</span>
    </a>
  );
}

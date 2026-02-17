import { Link as LinkIcon } from 'lucide-react';
import { getFaviconUrl } from '../../utils/url';
import type { QuickLink } from '../../types/settings';

export function DockItem({ link }: { link: QuickLink }) {
  const faviconUrl = getFaviconUrl(link.url);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="dock-item"
      title={link.name}
    >
      <span className="dock-item-icon">
        {faviconUrl ? (
          <img
            src={faviconUrl}
            alt={link.name}
            className="dock-item-favicon"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('dock-fallback-hidden');
            }}
          />
        ) : null}
        <span className={`dock-fallback ${faviconUrl ? 'dock-fallback-hidden' : ''}`}>
          <LinkIcon size={22} />
        </span>
      </span>
    </a>
  );
}

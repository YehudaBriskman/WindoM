import { X, Link as LinkIcon } from 'lucide-react';
import { getFaviconUrl, isValidUrl } from '../../utils/url';
import type { QuickLink } from '../../types/settings';

export function DockItem({ link, onRemove }: { link: QuickLink; onRemove?: () => void }) {
  const faviconUrl = getFaviconUrl(link.url);
  const safe = isValidUrl(link.url);

  return (
    <div className="dock-item-wrapper">
      <a
        href={safe ? link.url : undefined}
        aria-disabled={!safe || undefined}
        target="_self"
        className="dock-item"
        title={safe ? link.name : `${link.name}: enter an HTTP or HTTPS URL in Settings`}
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
      {onRemove && (
        <button
          className="dock-item-remove"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          title="Remove"
        >
          <X size={9} />
        </button>
      )}
    </div>
  );
}

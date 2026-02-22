import { Link } from 'lucide-react';
import { useLinks } from '../../../hooks/useLinks';
import { isValidUrl, getFaviconUrl } from '../../../utils/url';

export function LinksSettings() {
  const { links, addLink, removeLink, updateLink } = useLinks();

  return (
    <div>
      {links.length > 0 && (
        <div className="link-table-header">
          <span>Icon</span>
          <span>Name</span>
          <span>URL</span>
          <span />
        </div>
      )}
      <div className="link-editor-list link-editor-table">
        {links.map((link, i) => {
          const urlInvalid = link.url.length > 8 && !isValidUrl(link.url);
          const faviconUrl = getFaviconUrl(link.url);

          return (
            <div key={i} className="link-table-row">
              <div className="link-favicon-cell">
                {faviconUrl ? (
                  <img
                    src={faviconUrl}
                    className="link-favicon-preview"
                    alt=""
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement | null)?.removeAttribute('style'); }}
                  />
                ) : null}
                <div className="link-favicon-fallback" style={faviconUrl ? { display: 'none' } : {}}>
                  <Link size={14} strokeWidth={1.8} />
                </div>
              </div>
              <input
                type="text"
                value={link.name}
                placeholder="Name"
                onChange={(e) => updateLink(i, { ...link, name: e.target.value })}
                className="link-editor-input glass-input"
              />
              <input
                type="text"
                value={link.url}
                placeholder="URL"
                onChange={(e) => updateLink(i, { ...link, url: e.target.value })}
                className={`link-editor-input glass-input${urlInvalid ? ' url-invalid' : ''}`}
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="link-remove-btn"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={addLink}
        className="link-add-btn"
      >
        + Add Link
      </button>
    </div>
  );
}

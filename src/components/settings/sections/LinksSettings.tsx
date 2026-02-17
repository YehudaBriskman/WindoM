import { useLinks } from '../../../hooks/useLinks';
import { isValidUrl } from '../../../utils/url';

export function LinksSettings() {
  const { links, addLink, removeLink, updateLink } = useLinks();

  return (
    <div>
      <div className="link-editor-list">
        {links.map((link, i) => (
          <LinkEditorItem
            key={i}
            link={link}
            onChange={(updated) => updateLink(i, updated)}
            onRemove={() => removeLink(i)}
          />
        ))}
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

function LinkEditorItem({
  link,
  onChange,
  onRemove,
}: {
  link: { name: string; url: string; icon: string };
  onChange: (updated: { name: string; url: string; icon: string }) => void;
  onRemove: () => void;
}) {
  const handleChange = (field: 'name' | 'url' | 'icon', value: string) => {
    onChange({ ...link, [field]: value });
  };

  const urlInvalid = link.url.length > 8 && !isValidUrl(link.url);

  return (
    <div className="link-editor-item">
      <input
        type="text"
        value={link.name}
        placeholder="Name"
        onChange={(e) => handleChange('name', e.target.value)}
        className="link-editor-input glass-input"
      />
      <input
        type="text"
        value={link.url}
        placeholder="URL"
        onChange={(e) => handleChange('url', e.target.value)}
        className={`link-editor-input glass-input ${urlInvalid ? 'url-invalid' : ''}`}
      />
      <input
        type="text"
        value={link.icon}
        placeholder="Icon"
        maxLength={20}
        onChange={(e) => handleChange('icon', e.target.value)}
        className="link-editor-input glass-input icon-input"
      />
      <button
        type="button"
        onClick={onRemove}
        className="link-remove-btn"
      >
        &times;
      </button>
    </div>
  );
}

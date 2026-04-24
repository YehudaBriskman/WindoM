import { useState } from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import { TEMPLATES, type SettingsTemplate } from '../../../lib/templates';

function TemplateCard({ template, onApply }: { template: SettingsTemplate; onApply: () => void }) {
  return (
    <div className="template-card">
      <div className="template-thumbnail">
        <img src={template.thumbnail} alt={template.name} draggable={false} />
      </div>
      <div className="template-info">
        <span className="template-name">{template.name}</span>
        <span className="template-desc">{template.description}</span>
      </div>
      <button type="button" className="template-apply-btn" onClick={onApply}>
        Apply
      </button>
    </div>
  );
}

export function TemplatesGallery() {
  const { updateMultiple } = useSettings();
  const [applied, setApplied] = useState<string | null>(null);

  function handleApply(template: SettingsTemplate) {
    const sectionNames = Object.keys(template.settings).join(', ');
    if (!confirm(`Apply the "${template.name}" template? This will overwrite your settings for: ${sectionNames}.`)) return;

    void updateMultiple(template.settings as Parameters<typeof updateMultiple>[0]);
    setApplied(template.id);
    setTimeout(() => setApplied(null), 2500);
  }

  return (
    <div className="templates-gallery">
      <p className="settings-hint" style={{ marginBottom: '16px' }}>
        Start with a preset layout. Applying a template only overwrites the sections it defines — your other settings are untouched.
      </p>
      <div className="templates-grid">
        {TEMPLATES.map((t) => (
          <div key={t.id} style={{ position: 'relative' }}>
            <TemplateCard template={t} onApply={() => handleApply(t)} />
            {applied === t.id && (
              <div className="template-applied-badge">Applied!</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

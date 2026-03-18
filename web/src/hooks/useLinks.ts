import { useSettings } from '../contexts/SettingsContext';
import { defaultSettings, type QuickLink } from '../types/settings';

const MAX_LINKS = 27;

export function useLinks() {
  const { settings, update } = useSettings();
  const links = settings.quickLinks ?? defaultSettings.quickLinks;

  const setLinks = (newLinks: QuickLink[]) => update('quickLinks', newLinks);

  const addLink = (link?: QuickLink) => {
    if (links.length >= MAX_LINKS) return;
    const isValidLink = (v: unknown): v is QuickLink =>
      typeof v === 'object' && v !== null && 'url' in v && 'name' in v;
    setLinks([...links, isValidLink(link) ? link : { name: 'New Link', url: 'https://', icon: '' }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, updated: QuickLink) => {
    const next = [...links];
    next[index] = updated;
    setLinks(next);
  };

  return { links, setLinks, addLink, removeLink, updateLink };
}

import { useSettings } from '../contexts/SettingsContext';
import type { QuickLink } from '../types/settings';

const defaultLinks: QuickLink[] = [
  { name: 'Gmail', url: 'https://gmail.com', icon: 'mail' },
  { name: 'YouTube', url: 'https://youtube.com', icon: 'play' },
  { name: 'GitHub', url: 'https://github.com', icon: 'github' },
  { name: 'Twitter', url: 'https://twitter.com', icon: 'twitter' },
  { name: 'Reddit', url: 'https://reddit.com', icon: 'bot' },
];

export function useLinks() {
  const { settings, update } = useSettings();
  const links = settings.quickLinks ?? defaultLinks;

  const setLinks = (newLinks: QuickLink[]) => update('quickLinks', newLinks);

  const addLink = () => {
    if (links.length >= 10) return;
    setLinks([...links, { name: 'New Link', url: 'https://', icon: 'link' }]);
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

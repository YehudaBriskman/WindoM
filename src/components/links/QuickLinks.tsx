import { useLinks } from '../../hooks/useLinks';
import { LinkItem } from './LinkItem';

export function QuickLinks() {
  const { links } = useLinks();

  if (!links.length) return null;

  return (
    <div className="quick-links">
      {links.map((link, i) => (
        <LinkItem key={`${link.url}-${i}`} link={link} />
      ))}
    </div>
  );
}

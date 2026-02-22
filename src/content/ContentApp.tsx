import { ContentSettingsProvider } from './ContentSettingsProvider';
import { GlassFilters } from '../components/GlassFilters';
import { SearchOverlay } from '../components/search/SearchOverlay';

export function ContentApp() {
  return (
    <ContentSettingsProvider>
      <GlassFilters />
      <SearchOverlay />
    </ContentSettingsProvider>
  );
}

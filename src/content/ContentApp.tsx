import { ContentSettingsProvider } from './ContentSettingsProvider';
import { GlassFilters } from '../components/GlassFilters';
import { SearchOverlay } from '../components/search/SearchOverlay';
import { TabSidebar } from '../components/tabs/TabSidebar';

export function ContentApp() {
  return (
    <ContentSettingsProvider>
      <GlassFilters />
      <SearchOverlay />
      <TabSidebar />
    </ContentSettingsProvider>
  );
}

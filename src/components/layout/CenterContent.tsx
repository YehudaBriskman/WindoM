import { useSettings } from '../../contexts/SettingsContext';
import { Clock } from '../clock/Clock';
import { Greeting } from '../clock/Greeting';
import { FocusInput } from '../focus/FocusInput';
import { FocusPresets } from '../focus/FocusPresets';
import { SearchBar } from '../focus/SearchBar';

export function CenterContent() {
  const { settings } = useSettings();

  return (
    <div className="center-content">
      <div className="center-content-inner">
        <Clock />
        <Greeting />
      </div>
      {settings.centerInputMode === 'search' ? (
        <SearchBar />
      ) : (
        <>
          <FocusInput />
          <FocusPresets />
        </>
      )}
    </div>
  );
}

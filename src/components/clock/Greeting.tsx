import { useGreeting } from '../../hooks/useGreeting';
import { useSettings } from '../../contexts/SettingsContext';
import { EditableName } from './EditableName';

export function Greeting() {
  const { settings } = useSettings();
  const greeting = useGreeting();

  if (!settings.showGreeting) return null;

  return (
    <div className="greeting text-shadow-sm">
      {greeting}, <EditableName />
    </div>
  );
}

import { useGreeting } from '../../hooks/useGreeting';
import { EditableName } from './EditableName';

export function Greeting() {
  const greeting = useGreeting();

  return (
    <div className="greeting text-shadow-sm">
      {greeting}, <EditableName />
    </div>
  );
}

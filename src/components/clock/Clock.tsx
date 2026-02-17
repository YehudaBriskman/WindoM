import { useClock } from '../../hooks/useClock';

export function Clock({ id }: { id?: string }) {
  const { time, ampm } = useClock();

  return (
    <div id={id} className="clock text-shadow-md">
      {time}
      {ampm && (
        <span className="clock-ampm">{ampm}</span>
      )}
    </div>
  );
}

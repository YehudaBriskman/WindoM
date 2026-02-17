import { useBackgroundContext } from '../../contexts/BackgroundContext';

export function PhotographerCredit() {
  const { photographer } = useBackgroundContext();

  if (!photographer) return null;

  return (
    <div className="photographer-credit glass-credit text-shadow-credit">
      Photo by{' '}
      <a
        href={`${photographer.url}?utm_source=momentum-clone&utm_medium=referral`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {photographer.name}
      </a>{' '}
      on{' '}
      <a
        href="https://unsplash.com?utm_source=momentum-clone&utm_medium=referral"
        target="_blank"
        rel="noopener noreferrer"
      >
        Unsplash
      </a>
    </div>
  );
}

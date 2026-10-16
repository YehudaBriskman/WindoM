import { useQuotes } from '../../hooks/useQuotes';

export function QuoteDisplay() {
  const { quote, fading, refresh, enabled } = useQuotes();

  if (!enabled) return null;

  return (
    <button
      type="button"
      className="quote-container"
      onClick={refresh}
      title="Click for new quote"
      aria-label="Show a new quote"
    >
      <p
        className="quote-text text-shadow-sm"
        style={{ opacity: fading ? 0 : 1 }}
      >
        {quote ? `"${quote.text}"` : ''}
      </p>
      <p
        className="quote-author text-shadow-sm"
        style={{ opacity: fading ? 0 : 1 }}
      >
        {quote ? `\u2014 ${quote.author}` : ''}
      </p>
    </button>
  );
}

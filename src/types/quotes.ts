export interface Quote {
  text: string;
  author: string;
  category: string;
}

export interface DailyQuoteCache {
  date: string;
  quote: Quote;
}

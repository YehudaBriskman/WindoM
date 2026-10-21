import type { ReactNode } from 'react';

interface BeatProps {
  eyebrow: string;
  title: ReactNode;
  body: string;
  /** Path under /images. A real screenshot of the extension, never a mock-up. */
  image: string;
  alt: string;
  caption: string;
  /** Which side the screenshot sits on. Alternating them keeps the page moving. */
  side?: 'left' | 'right';
}

/**
 * One beat of the story told under the stage.
 *
 * The stage argued that the tab is worth having; these show what it actually
 * looks like once you are in it. They are the product's own screenshots, tilted
 * in perspective and straightening as they are scrolled to - the same depth
 * language as the stage, so the page reads as one idea rather than a hero
 * followed by a brochure.
 */
export function Beat({ eyebrow, title, body, image, alt, caption, side = 'right' }: BeatProps) {
  return (
    <section className={`section beat beat-${side}`}>
      <div className="wrap beat-wrap">
        <div className="beat-copy">
          <span className="eyebrow reveal">{eyebrow}</span>
          <h2 className="reveal">{title}</h2>
          <p className="lede reveal">{body}</p>
        </div>

        <figure className="beat-figure">
          {/* The wash is what keeps a dark screenshot from sitting in a dark
              page as a grey rectangle. */}
          <span className="beat-splash" aria-hidden="true" />
          <div className="beat-frame">
            <img src={image} alt={alt} loading="lazy" decoding="async" />
          </div>
          <figcaption>{caption}</figcaption>
        </figure>
      </div>
    </section>
  );
}

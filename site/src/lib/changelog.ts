/**
 * Turns the repository's CHANGELOG.md into the release list the home page shows.
 *
 * This runs at build time only - vite.config.ts calls it from the
 * `virtual:release-feed` module - so the page ships a few hundred bytes of
 * parsed releases rather than the 20 KB of Markdown, and needs no request to
 * render them. The changelog is already written for every release (it is part
 * of cutting one), which makes it the one source of release notes that cannot
 * be empty: #374 was a feed whose only source was a blog collection nobody had
 * written to.
 *
 * Pure and dependency-free so `node --test` can run it with no build in front.
 */

export interface Release {
  /** "1.5.1", without the brackets or a leading v. */
  version: string;
  /** ISO date as the changelog writes it, "2026-10-26". */
  date: string;
  /** One or two plain-text sentences: the release's intro, else its first entry. */
  summary: string;
  /** GitHub's anchor for the heading, so a link lands on this release. */
  anchor: string;
}

// `## [1.5.1] - 2026-10-26`. Keep a Changelog also allows `## [Unreleased]`,
// which has no date and is deliberately not matched: it has not shipped.
const RELEASE_HEADING = /^## \[(\d+\.\d+\.\d+[^\]]*)\] - (\d{4}-\d{2}-\d{2})\s*$/;

/** How many releases the home page lists, and so how many the build ships. */
export const FEED_SIZE = 4;

/** Longest summary before it is cut back to a sentence or a word boundary. */
export const SUMMARY_MAX = 220;

/** Markdown emphasis, code and links reduced to the text a reader sees. */
function plain(md: string): string {
  return (
    md
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      // Asterisks only: underscores appear inside identifiers (`READ_ONLY_MODE`)
      // far more often than as emphasis in this file.
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Shortens to whole sentences when one fits, otherwise to a word boundary with
 * an ellipsis. A summary that stops mid-clause reads as a rendering fault.
 */
export function clip(text: string, max = SUMMARY_MAX): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const sentenceEnd = Math.max(head.lastIndexOf('. '), head.lastIndexOf('. '));
  if (sentenceEnd >= max / 3) return head.slice(0, sentenceEnd + 1);
  const space = head.lastIndexOf(' ');
  return `${head.slice(0, space > 0 ? space : max).replace(/[\s,;:-]+$/, '')}…`;
}

/**
 * GitHub's heading slug: lower-cased, punctuation other than `-` dropped,
 * each space a hyphen. `[1.5.1] - 2026-10-26` becomes `151---2026-10-26`.
 */
export function githubAnchor(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/ /g, '-');
}

function summaryOf(body: string[]): string {
  // The intro: prose between the heading and the first `###` or bullet.
  const intro: string[] = [];
  for (const line of body) {
    if (line.startsWith('#') || /^\s*[-*] /.test(line)) break;
    if (line.trim() === '' || line.trim() === '---') {
      if (intro.length) break;
      continue;
    }
    intro.push(line);
  }
  if (intro.length) return clip(plain(intro.join(' ')));

  // No intro (the older releases): the first entry, with its continuation lines.
  const first = body.findIndex((l) => /^\s*[-*] /.test(l));
  if (first === -1) return '';
  const entry = [body[first]!.replace(/^\s*[-*] /, '')];
  for (const line of body.slice(first + 1)) {
    if (!/^\s{2,}\S/.test(line)) break;
    entry.push(line);
  }
  return clip(plain(entry.join(' ')));
}

/** Every dated release in the changelog, newest first as the file orders them. */
export function parseChangelog(markdown: string): Release[] {
  const lines = markdown.split(/\r?\n/);
  const releases: Release[] = [];

  for (let i = 0; i < lines.length; i++) {
    const m = RELEASE_HEADING.exec(lines[i]!);
    if (!m) continue;
    let end = i + 1;
    while (end < lines.length && !lines[end]!.startsWith('## ')) end++;
    releases.push({
      version: m[1]!,
      date: m[2]!,
      summary: summaryOf(lines.slice(i + 1, end)),
      anchor: githubAnchor(lines[i]!.slice(3)),
    });
    i = end - 1;
  }

  return releases;
}

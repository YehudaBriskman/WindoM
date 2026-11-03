/**
 * The newest releases from CHANGELOG.md, produced at build time by
 * `releaseFeedPlugin` in vite.config.ts. See src/lib/changelog.ts.
 */
declare module 'virtual:release-feed' {
  const releases: import('./lib/changelog').Release[];
  export default releases;
}

/// <reference types="vite/client" />

declare module 'virtual:bundled-images' {
  /** Paths relative to the extension root, e.g. "images/bundled-bg.jpg" */
  const paths: string[];
  export default paths;
}

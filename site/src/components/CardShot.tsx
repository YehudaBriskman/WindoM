/**
 * A product screenshot, as something the actor can hold.
 *
 * The second content type, and the reason the engine's content swapping is
 * worth having: the sections below the stage were arguing their point with
 * static screenshots while a live tab sat unused above them. Now the same
 * shell carries both, so a reader watches one object change what it is
 * showing rather than meeting a sequence of unrelated pictures.
 */
export function CardShot({ src, alt }: { src: string; alt: string }) {
  return <img className="card-shot" src={src} alt={alt} loading="lazy" decoding="async" />;
}

import { useEffect, useRef, useState } from "react";

type ZoomedImage = { readonly src: string; readonly alt: string };

// Images live in two places: `.screenshot` thumbnails rendered in JSX and
// `.prose img` injected via dangerouslySetInnerHTML from markdown. A single
// delegated click listener covers both without per-image wiring.
const ZOOMABLE_SELECTOR = "img.screenshot, .prose img";

export function zoomableImageFrom(target: EventTarget | null): ZoomedImage | null {
  if (!(target instanceof HTMLImageElement)) return null;
  if (!target.matches(ZOOMABLE_SELECTOR)) return null;
  return { src: target.currentSrc || target.src, alt: target.alt };
}

export function Lightbox() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [image, setImage] = useState<ZoomedImage | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const zoomed = zoomableImageFrom(event.target);
      if (zoomed === null) return;
      setImage(zoomed);
      dialogRef.current?.showModal();
    }
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
    };
  }, []);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label="Enlarged image"
      onClose={() => setImage(null)}
      onClick={(event) => {
        // Clicks on the backdrop resolve to the <dialog> element itself; clicks
        // on the image do not — so this closes only on backdrop/outside clicks.
        if (event.target === dialogRef.current) close();
      }}
    >
      {image !== null && (
        <figure className="lightbox-figure">
          <button type="button" className="lightbox-close" onClick={close}>
            <span className="only-light">Close</span>
            <span className="only-dark">[esc]</span>
          </button>
          <img className="lightbox-img" src={image.src} alt={image.alt} />
        </figure>
      )}
    </dialog>
  );
}

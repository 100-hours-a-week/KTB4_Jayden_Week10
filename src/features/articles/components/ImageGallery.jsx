import { useState } from 'react';
import emptyPostImage from '../../../../assets/images/empty-posts.svg';

function GalleryImage({ src, index }) {
  const [hasError, setHasError] = useState(false);
  return (
    <img
      className="gallery-image"
      src={hasError ? emptyPostImage : src}
      alt={`게시글 이미지 ${index + 1}`}
      onError={() => setHasError(true)}
    />
  );
}

export function ImageGallery({ images }) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (images.length === 0) return null;

  const safeActiveIndex = activeIndex % images.length;
  const hasMultipleImages = images.length > 1;

  return (
    <section className="article-gallery" aria-label="게시글 이미지">
      {hasMultipleImages && (
        <button
          className="gallery-arrow gallery-arrow--previous"
          type="button"
          aria-label="이전 이미지"
          onClick={() => setActiveIndex((current) => (current - 1 + images.length) % images.length)}
        >‹</button>
      )}
      {images.map((image, index) => (
        <figure className={`gallery-slide${index === safeActiveIndex ? ' is-active' : ''}`} key={`${image}-${index}`}>
          <GalleryImage src={image} index={index} />
        </figure>
      ))}
      {hasMultipleImages && (
        <>
          <span className="gallery-position" aria-live="polite">{safeActiveIndex + 1} / {images.length}</span>
          <button
            className="gallery-arrow gallery-arrow--next"
            type="button"
            aria-label="다음 이미지"
            onClick={() => setActiveIndex((current) => (current + 1) % images.length)}
          >›</button>
        </>
      )}
    </section>
  );
}

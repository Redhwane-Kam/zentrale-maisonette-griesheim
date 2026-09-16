import React, { useState, useRef } from "react";
import "./HeroCarousel.css";

export default function HeroCarousel({ images }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  function goTo(newIndex) {
    const total = images.length;
    setIndex(((newIndex % total) + total) % total);
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const SWIPE_THRESHOLD = 40;

    if (deltaX > SWIPE_THRESHOLD) {
      goTo(index - 1); // glissé vers la droite → image précédente
    } else if (deltaX < -SWIPE_THRESHOLD) {
      goTo(index + 1); // glissé vers la gauche → image suivante
    }
    touchStartX.current = null;
  }

  if (!images || images.length === 0) return null;

  return (
    <div
      className="hero-carousel"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <img
        src={images[index]}
        alt=""
        className="hero-carousel-image"
      />

      {images.length > 1 && (
        <>
          <button
            type="button"
            className="hero-carousel-arrow hero-carousel-arrow-left"
            onClick={() => goTo(index - 1)}
            aria-label="Image précédente"
          >
            ‹
          </button>
          <button
            type="button"
            className="hero-carousel-arrow hero-carousel-arrow-right"
            onClick={() => goTo(index + 1)}
            aria-label="Image suivante"
          >
            ›
          </button>

          <div className="hero-carousel-dots">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`hero-carousel-dot ${i === index ? "active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Aller à l'image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

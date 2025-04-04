import { useState } from "react";
import { ArrowLeft, ArrowRight, Circle, CircleDot } from "lucide-react"; // Use CircleDot instead of Eclipse

type ImageSliderProps = {
  images: {
    url: string;
    alt: string;
  }[];
};

export function ImageSlider({ images }: ImageSliderProps) {
  const [imageIndex, setImageIndex] = useState(0);

  function showNextImage() {
    setImageIndex((index) => (index === images.length - 1 ? 0 : index + 1));
  }

  function showPrevImage() {
    setImageIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  }

  return (
    <div className="ImageCarousel relative z-30">
      {/* Left Button */}
      <button
        onClick={showPrevImage}
        className="absolute left-0 top-0 h-full w-12 bg-black/50 text-white flex items-center justify-center z-50 opacity-0 transition-opacity duration-300"
        aria-label="Previous Image"
      >
        <ArrowLeft size={24} />
      </button>

      {/* Images */}
      {images.map(({ url, alt }, index) => (
        <img
          key={url}
          src={url}
          alt={alt}
          aria-hidden={imageIndex !== index}
          className="PostImg"
          style={{ translate: `${-100 * imageIndex}%` }}
        />
      ))}

      {/* Right Button */}
      <button
        onClick={showNextImage}
        className="absolute right-0 top-0 h-full w-12 bg-black/50 text-white flex items-center justify-center z-50 opacity-0 transition-opacity duration-300"
        aria-label="Next Image"
      >
        <ArrowRight size={24} />
      </button>

      {/* Dot Buttons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        {images.map((_, index) => (
          <button
            key={index}
            className="img-slider-dot-btn w-4 h-4 flex items-center justify-center opacity-0 transition-opacity duration-300"
            aria-label={`View Image ${index + 1}`}
            onClick={() => setImageIndex(index)}
          >
            {index === imageIndex ? (
              <CircleDot size={16} className="text-white" aria-hidden />
            ) : (
              <Circle size={16} className="text-white/50" aria-hidden />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
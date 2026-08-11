import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  zoomLevel?: number;
}

const ImageZoom: React.FC<ImageZoomProps> = ({ 
  src, 
  alt, 
  className = "w-full h-full object-cover",
  zoomLevel = 2.5 
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePos({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden cursor-zoom-in"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Base image */}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-200 ${
          isHovering ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Zoomed image overlay */}
      {isHovering && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 overflow-hidden bg-gray-50"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: `${zoomLevel * 100}% ${zoomLevel * 100}%`,
            backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
          }}
        />
      )}

      {/* Corner indicator */}
      {isHovering && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 text-white text-xs rounded"
        >
          Zoom
        </motion.div>
      )}
    </div>
  );
};

export default ImageZoom;

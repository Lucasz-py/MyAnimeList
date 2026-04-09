import React, { useRef, useState,type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export interface AnimeScrollCanvasProps {
  totalFrames: number;
  baseUrl: string;
  framePrefix?: string;
  fileExtension?: string;
  padLength?: number;
  scrollDistance?: string;
  children?: ReactNode; 
}

export const AnimeScrollCanvas: React.FC<AnimeScrollCanvasProps> = ({
  totalFrames,
  baseUrl,
  framePrefix = 'frame_',
  fileExtension = '.webp',
  padLength = 4,
  scrollDistance = '400vh',
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const animationRef = useRef({ frame: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const getImageUrl = (index: number) => {
    const paddedIndex = padLength > 0 
      ? (index + 1).toString().padStart(padLength, '0') 
      : (index + 1).toString();
    return `${baseUrl}${framePrefix}${paddedIndex}${fileExtension}`;
  };

  const renderFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    const img = imagesRef.current[frameIndex];

    if (!canvas || !ctx || !img) return;

    const canvasRatio = canvas.width / canvas.height;
    const imgRatio = img.width / img.height;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
      drawWidth = canvas.width;
      drawHeight = canvas.width / imgRatio;
      offsetX = 0;
      offsetY = (canvas.height - drawHeight) / 2;
    } else {
      drawWidth = canvas.height * imgRatio;
      drawHeight = canvas.height;
      offsetX = (canvas.width - drawWidth) / 2;
      offsetY = 0;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if (imagesRef.current.length > 0) {
      renderFrame(Math.round(animationRef.current.frame));
    }
  };

  useGSAP(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const absorbTl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: `+=${scrollDistance}`,
        scrub: 1, 
        pin: true,
        anticipatePin: 1, 
      }
    });

    absorbTl.to(animationRef.current, {
      frame: totalFrames - 1,
      snap: 'frame',
      ease: 'none',
      duration: 1,
      onUpdate: () => {
        if (imagesRef.current.length > 0) {
          renderFrame(Math.round(animationRef.current.frame));
        }
      }
    });

    const preloadImages = async () => {
      const loadPromises = Array.from({ length: totalFrames }).map((_, i) => {
        return new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          const url = getImageUrl(i);
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      });

      imagesRef.current = await Promise.all(loadPromises);
      setIsLoaded(true);
      handleResize(); 

      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    };

    preloadImages();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, { scope: containerRef }); 

  return (
    <div ref={containerRef} className="relative w-full h-[100dvh] bg-[#0a0a0a] overflow-hidden">
      {/* CAPA 1: EL CANVAS (z-10) */}
      <canvas 
        ref={canvasRef} 
        className={`absolute inset-0 w-full h-full block z-10 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
      />

      {/* CAPA 2: CONTENIDO SUPERPUESTO (z-20) */}
      {children && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="pointer-events-auto w-full h-full">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};
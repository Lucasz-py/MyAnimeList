import React, { useRef, useState } from 'react';
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
}

export const AnimeScrollCanvas: React.FC<AnimeScrollCanvasProps> = ({
  totalFrames,
  baseUrl,
  framePrefix = 'frame_',
  fileExtension = '.webp',
  padLength = 4,
  scrollDistance = '400vh', // Aumentado para mayor fluidez
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
    
    // Si ya tenemos imágenes, redibujamos el frame actual
    if (imagesRef.current.length > 0) {
      renderFrame(Math.round(animationRef.current.frame));
    }
  };

  useGSAP(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. SINCRONIZACIÓN INMEDIATA: Creamos el Timeline de GSAP en el milisegundo 0.
    // Esto EVITA que se rompa el layout (el hueco gris) al recargar la página.
    const absorbTl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: `+=${scrollDistance}`,
        scrub: 1, // Cambiado a 1 para una inercia más sedosa
        pin: true,
        anticipatePin: 1, // Previene el salto al inicio del scroll
      }
    });

    absorbTl.to(animationRef.current, {
      frame: totalFrames - 1,
      snap: 'frame',
      ease: 'none',
      duration: 1,
      onUpdate: () => {
        // Solo intentamos dibujar si las imágenes ya cargaron en memoria
        if (imagesRef.current.length > 0) {
          renderFrame(Math.round(animationRef.current.frame));
        }
      }
    });

    // 2. CARGA ASÍNCRONA EN SEGUNDO PLANO
    const preloadImages = async () => {
      const loadPromises = Array.from({ length: totalFrames }).map((_, i) => {
        return new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          const url = getImageUrl(i);
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => {
            console.error(`❌ ERROR: No se encontró: ${url}`);
            resolve(null);
          };
        });
      });

      imagesRef.current = await Promise.all(loadPromises);
      setIsLoaded(true);
      handleResize(); // Dibujamos el frame 0 una vez todo está listo
    };

    preloadImages();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, { scope: containerRef }); 

  return (
    // CAMBIO IMPORTANTE: Usamos h-screen fijo para evitar bugs de recálculo en móviles
    <div ref={containerRef} className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden">
      
      <canvas 
        ref={canvasRef} 
        className={`w-full h-full block z-10 relative transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
      />

    </div>
  );
};
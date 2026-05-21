"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

const CITIES = [
  { id: "taipei",    location: [25.05,  121.53] as [number, number], delay: 0.0 },
  { id: "tokyo",     location: [35.68,  139.69] as [number, number], delay: 0.4 },
  { id: "sf",        location: [37.77, -122.4 ] as [number, number], delay: 0.8 },
  { id: "london",    location: [51.51,   -0.13] as [number, number], delay: 1.2 },
  { id: "singapore", location: [ 1.35,  103.82] as [number, number], delay: 1.6 },
  { id: "sydney",    location: [-33.87, 151.2 ] as [number, number], delay: 2.0 },
];

export function CobeGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phi          = 0.5;
    let targetTheta  = 0.25;
    let currentTheta = 0.25;
    let targetScale  = 1.6;
    let currentScale = 1.6;
    let rafId: number;
    let width = 650;
    let height = 650;

    const dpr = Math.min(window.devicePixelRatio || 2, 2);
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const size = Math.max(280, Math.floor(Math.min(rect.width || 650, rect.height || rect.width || 650)));
      width = size;
      height = size;
    };
    updateSize();

    const getOffsetX = () => {
      const isMobile = window.innerWidth < 768;
      return Math.round((isMobile ? width * 0.03 : width * 0.12) * dpr);
    };

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: width * dpr,
      height: height * dpr,
      phi,
      theta: currentTheta,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 20000,
      mapBrightness: 6,
      baseColor:   [0.05, 0.12, 0.18],
      markerColor: [0.18, 0.78, 1.0 ],
      glowColor:   [0.04, 0.45, 0.65],
      scale: currentScale,
      offset: [getOffsetX(), 0],
      markerElevation: 0,
      markers: CITIES.map(c => ({ location: c.location, size: 0.04, id: c.id })),
    });

    const onResize = () => {
      updateSize();
      globe.update({ width: width * dpr, height: height * dpr, offset: [getOffsetX(), 0] });
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);
    window.addEventListener("resize", onResize);

    const animate = () => {
      phi += 0.004;

      const rect = canvas.getBoundingClientRect();
      const vh   = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
      targetScale = 1.6 - Math.sin(progress * Math.PI) * 0.7;

      currentTheta += (targetTheta  - currentTheta)  * 0.06;
      currentScale += (targetScale  - currentScale)  * 0.06;
      globe.update({ phi, theta: currentTheta, scale: currentScale, offset: [getOffsetX(), 0] });
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    const onMouseMove = (e: MouseEvent) => {
      const r  = canvas.getBoundingClientRect();
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      targetTheta = 0.25 + ny * 0.22;
    };
    const onMouseLeave = () => { targetTheta = 0.25; };

    canvas.addEventListener("mousemove",  onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      globe.destroy();
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove",  onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 650,
        aspectRatio: "1 / 1",
        marginInline: "auto",
      }}
    >
      <style>{`
        @keyframes globe-pulse {
          0%   { transform: scale(0.2); opacity: 0.9; }
          100% { transform: scale(3);   opacity: 0;   }
        }
      `}</style>

      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", cursor: "crosshair" }}
      />

      {CITIES.map((c) => (
        <div
          key={c.id}
          style={{
            position: "absolute",
            positionAnchor: `--cobe-${c.id}`,
            bottom: "anchor(center)",
            left:   "anchor(center)",
            translate: "-50% 50%",
            width:  20,
            height: 20,
            pointerEvents: "none",
            opacity:    `var(--cobe-visible-${c.id}, 0)`,
            transition: "opacity 0.35s",
          }}
        >
          <span style={{
            position: "absolute", inset: 0,
            border: "1.5px solid rgba(24,200,255,0.85)",
            borderRadius: "50%",
            animation: `globe-pulse 2.2s ease-out infinite ${c.delay}s`,
          }} />
          <span style={{
            position: "absolute", inset: 0,
            border: "1.5px solid rgba(24,200,255,0.5)",
            borderRadius: "50%",
            animation: `globe-pulse 2.2s ease-out infinite ${c.delay + 0.8}s`,
          }} />
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export function CobeGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phi = 0.5;
    let targetTheta = 0.25;
    let currentTheta = 0.25;
    let targetScale = 1.6;
    let currentScale = 1.6;
    let rafId: number;

    const dpr = window.devicePixelRatio || 2;
    // Shift globe center right so it doesn't clip on the left edge when scaled up
    const offsetX = 80 * dpr;
    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: 600 * dpr,
      height: 600 * dpr,
      phi,
      theta: currentTheta,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 20000,
      mapBrightness: 6,
      baseColor: [0.05, 0.12, 0.18],
      markerColor: [0.18, 0.78, 1],
      glowColor: [0.04, 0.45, 0.65],
      scale: currentScale,
      offset: [offsetX, 0],
      markers: [
        { location: [25.05, 121.53], size: 0.07 },
        { location: [35.68, 139.69], size: 0.05 },
        { location: [37.77, -122.4], size: 0.05 },
        { location: [51.51, -0.13],  size: 0.05 },
        { location: [1.35, 103.82],  size: 0.04 },
        { location: [-33.87, 151.2], size: 0.04 },
      ],
    });

    const animate = () => {
      phi += 0.004;

      // 進入視窗→縮小→離開視窗→回到原尺寸（sin 曲線）
      const rect = canvas.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
      targetScale = 1.6 - Math.sin(progress * Math.PI) * 0.7; // 1.6 → 0.9 → 1.6

      currentTheta += (targetTheta - currentTheta) * 0.06;
      currentScale += (targetScale - currentScale) * 0.06;
      globe.update({ phi, theta: currentTheta, scale: currentScale, offset: [offsetX, 0] });
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    // Parallax tilt: mouse Y → theta
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetTheta = 0.25 + ny * 0.22;
    };
    const onMouseLeave = () => { targetTheta = 0.25; };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      globe.destroy();
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: 600, height: 600, cursor: "crosshair" }}
    />
  );
}

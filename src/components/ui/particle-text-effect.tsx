"use client";

import { useEffect, useRef } from "react";

interface Vector2D {
  x: number;
  y: number;
}

class Particle {
  pos: Vector2D = { x: 0, y: 0 };
  vel: Vector2D = { x: 0, y: 0 };
  acc: Vector2D = { x: 0, y: 0 };
  target: Vector2D = { x: 0, y: 0 };
  homeTarget: Vector2D = { x: 0, y: 0 };
  scatterTarget: Vector2D = { x: 0, y: 0 };

  closeEnoughTarget = 100;
  maxSpeed = 1.0;
  maxForce = 0.1;
  particleSize = 10;
  isKilled = false;

  startColor = { r: 0, g: 0, b: 0 };
  targetColor = { r: 0, g: 0, b: 0 };
  colorWeight = 0;
  colorBlendRate = 0.01;

  move() {
    let proximityMult = 1;
    const distance = Math.sqrt(
      (this.pos.x - this.target.x) ** 2 + (this.pos.y - this.target.y) ** 2
    );
    if (distance < this.closeEnoughTarget) {
      proximityMult = distance / this.closeEnoughTarget;
    }

    const towards = { x: this.target.x - this.pos.x, y: this.target.y - this.pos.y };
    const mag = Math.sqrt(towards.x ** 2 + towards.y ** 2);
    if (mag > 0) {
      towards.x = (towards.x / mag) * this.maxSpeed * proximityMult;
      towards.y = (towards.y / mag) * this.maxSpeed * proximityMult;
    }

    const steer = { x: towards.x - this.vel.x, y: towards.y - this.vel.y };
    const sMag = Math.sqrt(steer.x ** 2 + steer.y ** 2);
    if (sMag > 0) {
      steer.x = (steer.x / sMag) * this.maxForce;
      steer.y = (steer.y / sMag) * this.maxForce;
    }

    this.acc.x += steer.x;
    this.acc.y += steer.y;
    this.vel.x += this.acc.x;
    this.vel.y += this.acc.y;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    this.acc.x = 0;
    this.acc.y = 0;
  }

  draw(ctx: CanvasRenderingContext2D, drawAsPoints: boolean) {
    if (this.colorWeight < 1.0) {
      this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0);
    }
    const c = {
      r: Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight),
      g: Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight),
      b: Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight),
    };
    ctx.fillStyle = `rgb(${c.r}, ${c.g}, ${c.b})`;
    if (drawAsPoints) {
      ctx.fillRect(this.pos.x, this.pos.y, 2, 2);
    } else {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  kill(width: number, height: number) {
    if (this.isKilled) return;
    const r = randomOffscreenPos(width / 2, height / 2, (width + height) / 2);
    this.target.x = r.x;
    this.target.y = r.y;
    this.startColor = {
      r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
      g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
      b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight,
    };
    this.targetColor = { r: 0, g: 0, b: 0 };
    this.colorWeight = 0;
    this.isKilled = true;
  }
}

// Internal canvas resolution cap — keeps particle count manageable on big screens
const MAX_CANVAS_W = 1920;
const MAX_CANVAS_H = 960;

function randomOffscreenPos(cx: number, cy: number, mag: number): Vector2D {
  const angle = Math.random() * Math.PI * 2;
  return { x: cx + Math.cos(angle) * mag, y: cy + Math.sin(angle) * mag };
}

interface ParticleTextEffectProps {
  words?: string[];
  /** ms between auto word changes; ignored when words.length === 1 */
  cycleMs?: number;
  /** palette to pick target colors from (hex). If omitted random rainbow. */
  palette?: string[];
  className?: string;
  /** Canvas backdrop. Default black; use "transparent" to overlay onto page bg. */
  background?: string;
}

const DEFAULT_WORDS = ["ADHOLIC"];

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function ParticleTextEffect({
  words = DEFAULT_WORDS,
  cycleMs = 4000,
  palette,
  className,
  background = "#000000",
}: ParticleTextEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const frameCountRef = useRef(0);
  const wordIndexRef = useRef(0);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  const pixelSteps = 10;
  const drawAsPoints = true;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;


    const pickColor = () => {
      if (palette && palette.length) return hexToRgb(palette[Math.floor(Math.random() * palette.length)]);
      return { r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255 };
    };

    const renderWord = (word: string) => {
      const off = document.createElement("canvas");
      off.width = canvas.width;
      off.height = canvas.height;
      const octx = off.getContext("2d")!;
      octx.fillStyle = "white";
      const fontSize = Math.floor(Math.min(canvas.width / (word.length * 0.62), canvas.height * 0.7) * 0.5);
      octx.font = `900 ${fontSize}px Outfit, Arial, sans-serif`;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillText(word, canvas.width / 2, canvas.height / 2);

      const { data: pixels } = octx.getImageData(0, 0, canvas.width, canvas.height);
      const newColor = pickColor();
      const particles = particlesRef.current;
      let pi = 0;

      const idxs: number[] = [];
      for (let i = 0; i < pixels.length; i += pixelSteps * 4) idxs.push(i);
      for (let i = idxs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
      }

      for (const idx of idxs) {
        if (pixels[idx + 3] > 0) {
          const x = (idx / 4) % canvas.width;
          const y = Math.floor(idx / 4 / canvas.width);

          let p: Particle;
          if (pi < particles.length) {
            p = particles[pi];
            p.isKilled = false;
            // If particle has already arrived at its previous target (colorWeight ~1),
            // re-launch it from offscreen so we always get a visible fly-in.
            if (p.colorWeight >= 0.999) {
              const rp = randomOffscreenPos(canvas.width / 2, canvas.height / 2, (canvas.width + canvas.height) / 2);
              p.pos.x = rp.x;
              p.pos.y = rp.y;
              p.vel.x = 0;
              p.vel.y = 0;
            }
            pi++;
          } else {
            p = new Particle();
            const rp = randomOffscreenPos(canvas.width / 2, canvas.height / 2, (canvas.width + canvas.height) / 2);
            p.pos.x = rp.x;
            p.pos.y = rp.y;
            p.maxSpeed = Math.random() * 6 + 4;
            p.maxForce = p.maxSpeed * 0.04;
            p.particleSize = Math.random() * 6 + 6;
            p.colorBlendRate = Math.random() * 0.05 + 0.03;
            particles.push(p);
          }

          p.startColor = {
            r: p.startColor.r + (p.targetColor.r - p.startColor.r) * p.colorWeight,
            g: p.startColor.g + (p.targetColor.g - p.startColor.g) * p.colorWeight,
            b: p.startColor.b + (p.targetColor.b - p.startColor.b) * p.colorWeight,
          };
          p.targetColor = newColor;
          p.colorWeight = 0;
          p.target.x = x;
          p.target.y = y;
          p.homeTarget.x = x;
          p.homeTarget.y = y;
          // Pre-compute each particle's unique escape direction for scatter
          const sp = randomOffscreenPos(canvas.width / 2, canvas.height / 2, (canvas.width + canvas.height) / 1.5);
          p.scatterTarget.x = sp.x;
          p.scatterTarget.y = sp.y;
        }
      }
      for (let i = pi; i < particles.length; i++) {
        particles[i].kill(canvas.width, canvas.height);
      }
    };

    const tick = () => {
      const ctx = canvas.getContext("2d")!;
      if (background === "transparent") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Scroll-linked scatter: 0 = home (text), 1 = fully scattered
      const wrapRect = wrap.getBoundingClientRect();
      const scrollRatio = Math.max(0, Math.min(1, -wrapRect.top / (wrapRect.height * 0.6)));

      const particles = particlesRef.current;
      const { x: mx, y: my } = mouseRef.current;
      const repelRadius = 100;
      const repelStrength = 2;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Lerp between homeTarget and scatterTarget based on scroll progress
        p.target.x = p.homeTarget.x + (p.scatterTarget.x - p.homeTarget.x) * scrollRatio;
        p.target.y = p.homeTarget.y + (p.scatterTarget.y - p.homeTarget.y) * scrollRatio;

        // Repel from mouse
        const dx = p.pos.x - mx;
        const dy = p.pos.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < repelRadius && d > 0) {
          const force = (1 - d / repelRadius) * repelStrength;
          p.vel.x += (dx / d) * force;
          p.vel.y += (dy / d) * force;
        }

        p.move();
        p.draw(ctx, drawAsPoints);
        if (p.isKilled) {
          if (p.pos.x < 0 || p.pos.x > canvas.width || p.pos.y < 0 || p.pos.y > canvas.height) {
            particles.splice(i, 1);
          }
        }
      }

      frameCountRef.current++;
      if (words.length > 1 && frameCountRef.current % Math.round(cycleMs / (1000 / 60)) === 0) {
        wordIndexRef.current = (wordIndexRef.current + 1) % words.length;
        renderWord(words[wordIndexRef.current]);
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    const sizeCanvas = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(320, Math.min(MAX_CANVAS_W, Math.floor(rect.width)));
      const h = Math.max(180, Math.min(MAX_CANVAS_H, Math.floor(rect.height)));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      renderWord(words[wordIndexRef.current] ?? words[0]);
    };

    sizeCanvas();
    // Ensure particles exist after a strict-mode remount where canvas size is unchanged
    if (particlesRef.current.length === 0) {
      renderWord(words[0]);
    }
    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(wrap);

    tick();

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const scaleX = canvas.width / r.width;
      const scaleY = canvas.height / r.height;
      mouseRef.current.x = (e.clientX - r.left) * scaleX;
      mouseRef.current.y = (e.clientY - r.top) * scaleY;
    };
    const onLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      // Reset state so StrictMode double-mount in dev restarts the fly-in.
      particlesRef.current = [];
      frameCountRef.current = 0;
      wordIndexRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ background: background === "transparent" ? undefined : background }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

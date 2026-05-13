"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export function Showcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 0.96]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-2, 2]);

  return (
    <section id="showcase" className="relative py-32">
      <div className="container-page">
        <motion.div
          ref={ref}
          style={{ scale, rotate }}
          className="relative mx-auto aspect-[16/10] w-full overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 shadow-2xl will-change-transform"
        >
          <div className="absolute inset-0 flex flex-col">
            <div className="flex items-center gap-2 border-b border-border/60 bg-background/40 px-5 py-3 backdrop-blur">
              <span className="h-3 w-3 rounded-full bg-red-400/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
              <span className="h-3 w-3 rounded-full bg-green-400/70" />
              <span className="ml-3 text-xs text-muted">ai-studio.app/preview</span>
            </div>
            <div className="grid flex-1 grid-cols-12 gap-4 p-8">
              <div className="col-span-7 flex flex-col justify-center gap-3">
                <div className="h-3 w-1/3 rounded-full bg-foreground/20" />
                <div className="h-10 w-5/6 rounded-lg bg-foreground/15" />
                <div className="h-10 w-3/4 rounded-lg bg-foreground/15" />
                <div className="mt-3 flex gap-2">
                  <div className="h-9 w-28 rounded-full bg-foreground" />
                  <div className="h-9 w-28 rounded-full border border-border" />
                </div>
              </div>
              <div className="col-span-5 rounded-2xl bg-background/50 p-4 backdrop-blur">
                <div className="grid h-full grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg bg-foreground/10" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion, useInView } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { CoffeeBeansCtaScene } from "@/components/CoffeeBeansCtaScene";

export function CoffeeBeansCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="cta" className="relative w-screen h-screen overflow-hidden">
      <CoffeeBeansCtaScene />
      {/* 文字疊在 3D 場景正中央 */}
      <div className="absolute inset-0 z-[10] flex items-center justify-center pointer-events-none">
        <motion.div
          ref={ref}
          initial={{ y: 40, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto text-center px-8 md:px-20"
        >
          <p className="mx-auto max-w-xl text-xs font-medium tracking-[0.18em] text-white/75 md:text-sm">
            ORYZO · REAL GLB + HDRI
          </p>
          <h2 className="mt-4 font-display text-balance text-4xl font-black tracking-tight text-white md:text-6xl">
            準備好讓 AI 替你建站了嗎？
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-white/85">
            免費試用，無需信用卡。三十秒看到你網站的雛型。
          </p>
          <a
            href="#"
            className="group mt-10 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-stone-900 transition-opacity hover:opacity-90"
          >
            立即開始建站
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export function CTA() {
  return null;
}

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="container-page flex flex-col items-center justify-between gap-4 text-sm text-muted md:flex-row">
        <p>© {new Date().getFullYear()} ADHOLIC. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground transition-colors cursor-pointer">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors cursor-pointer">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors cursor-pointer">Contact</a>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ParticleTextEffect } from "@/components/ui/particle-text-effect";
import { Easing } from "motion";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } },
};

const item = {
  hidden: { y: 40, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as unknown as Easing[],
    },
  },
};

const PALETTE = ["#00506E"];

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-white text-gray-900">
      <ParticleTextEffect
        words={["ADHOLIC"]}
        palette={PALETTE}
        background="#ffffff"
        className="absolute inset-0 z-0 h-full w-full"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-1/2 bg-gradient-to-b from-transparent to-white"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="container-page relative z-10 flex flex-col items-center pb-20 pt-[58vh] text-center pointer-events-none"
      >
        <motion.span
          variants={item}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-gray-100/70 px-4 py-1.5 text-xs font-medium text-gray-600 backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
          AI 驅動 · 一句話建站
        </motion.span>

        <motion.p
          variants={item}
          className="max-w-xl text-balance text-lg leading-relaxed text-gray-600 md:text-xl"
        >
          從描述到上線只要幾分鐘。AI 幫你寫文案、配色、選版型、加動畫，你只要點下發佈。
        </motion.p>

        <motion.div variants={item} className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#cta"
            className="group inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
          >
            免費開始
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </a>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-gray-50 px-7 py-4 text-base font-semibold text-gray-800 backdrop-blur transition-colors hover:bg-gray-100 cursor-pointer"
          >
            看看能做什麼
          </a>
        </motion.div>

        <motion.p variants={item} className="mt-10 text-xs text-gray-400">
          提示：將滑鼠移到文字上，粒子會排斥逃開 ✦
        </motion.p>
      </motion.div>
    </section>
  );
}

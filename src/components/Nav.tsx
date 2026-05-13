"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export function Nav() {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed inset-x-4 top-4 z-50 mx-auto max-w-6xl rounded-2xl border border-border/60 bg-background/70 px-6 py-3 backdrop-blur-xl"
    >
      <nav className="flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-display text-lg font-bold cursor-pointer">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          <span>ADHOLIC</span>
        </a>
        <ul className="hidden items-center gap-8 text-sm text-muted md:flex">
          <li><a href="#features" className="hover:text-foreground transition-colors cursor-pointer">功能</a></li>
          <li><a href="#showcase" className="hover:text-foreground transition-colors cursor-pointer">案例</a></li>
          <li><a href="#cta" className="hover:text-foreground transition-colors cursor-pointer">定價</a></li>
        </ul>
        <a
          href="#cta"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 cursor-pointer"
        >
          開始使用
        </a>
      </nav>
    </motion.header>
  );
}

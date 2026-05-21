"use client";

import { motion, useInView } from "motion/react";
import { Wand2, Palette, Gauge, Layers, Code2, Globe } from "lucide-react";
import { useRef } from "react";
import { CobeGlobe } from "@/components/ui/Globe";

const features = [
  { icon: Wand2,   title: "一句話生成",   desc: "描述你的品牌，AI 自動草擬整站結構與文案。" },
  { icon: Palette, title: "智慧配色",     desc: "依產業、情緒、目標自動產生符合品牌的色彩系統。" },
  { icon: Layers,  title: "67 種版型",   desc: "從極簡到 brutalism，挑一個風格就能直接套用。" },
  { icon: Gauge,   title: "效能優先",     desc: "預設 lazy load、image optim、預先取得字型。" },
  { icon: Code2,   title: "可導出原始碼", desc: "Next.js + Tailwind 乾淨原始碼，隨時自行二次開發。" },
  { icon: Globe,   title: "一鍵發佈",     desc: "綁定自訂網域、自動 SSL，幾秒完成上線。" },
];

function FeatureCard({
  Icon,
  title,
  desc,
  index,
}: {
  Icon: typeof Wand2;
  title: string;
  desc: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ y: 40, opacity: 0 }}
      animate={inView ? { y: 0, opacity: 1 } : {}}
      transition={{
        duration: 0.6,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-background/60 p-7 backdrop-blur transition-colors hover:bg-background/90 cursor-pointer"
    >
      <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-background">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
    </motion.div>
  );
}

function GlobeCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ y: 50, opacity: 0 }}
      animate={inView ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-5 overflow-hidden rounded-3xl border border-white/10 bg-[#04111a] shadow-2xl"
    >
      {/* subtle radial glow behind globe */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/2 h-[120%] w-[55%] -translate-y-1/2 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, #00506e 0%, transparent 70%)" }}
      />

      <div className="grid items-center gap-0 grid-cols-1 md:grid-cols-[4fr_6fr]">
        {/* Text side */}
        <div className="relative z-10 px-10 py-14 md:px-14">
          <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            全球 CDN
          </span>
          <h3 className="mt-5 font-display text-3xl font-black tracking-tight text-white md:text-4xl">
            你的網站，
            <br />
            飛向全世界
          </h3>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-white/60">
            自動部署到全球 40+ 個邊緣節點。無論訪客身在台北、東京還是倫敦，首頁載入都在 200 ms 以內。
          </p>
          <ul className="mt-7 space-y-2.5 text-sm text-white/50">
            {[
              "40+ 全球邊緣節點",
              "自動 SSL / TLS 憑證",
              "DDoS 防護內建",
              "99.99 % uptime SLA",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Globe side */}
        <div className="relative flex items-center justify-center overflow-hidden py-8 md:py-0">
          <CobeGlobe />
        </div>
      </div>
    </motion.div>
  );
}

export function Features() {
  const headRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headRef, { once: true, margin: "-100px" });

  return (
    <section id="features" className="relative py-32">
      <div className="container-page">
        <motion.div
          ref={headRef}
          initial={{ y: 30, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Features
          </p>
          <h2 className="mt-4 font-display text-balance text-4xl font-black tracking-tight md:text-6xl">
            建站該有的，都已內建
          </h2>
          <p className="mt-5 text-balance text-lg text-muted">
            不是模板拼貼，是真正為你的品牌量身設計的網站。
          </p>
        </motion.div>

        <div className="mt-16">
          <GlobeCard />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard key={f.title} Icon={f.icon} title={f.title} desc={f.desc} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

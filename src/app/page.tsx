import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Showcase } from "@/components/Showcase";
import { CTA, Footer, CoffeeBeansCard } from "@/components/CTA";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <Nav />
      <Hero />
      <Showcase />
      <Features />
      {/* <CoffeeBeansCard /> */}
      <CTA />
      <Footer />
    </main>
  );
}

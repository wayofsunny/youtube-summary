import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import Reviews from "@/components/home/Reviews";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[#030303] text-white">
      <Hero />
      <Features />
      <Reviews />
      <Footer />
    </main>
  );
}

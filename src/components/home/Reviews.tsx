// components/Reviews.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const reviews = [
  {
    name: "Aarav Mehta",
    text: "This app saved me countless hours — summarizing YouTube founder interviews into crisp takeaways. I now start my mornings with insights instead of endless scrolling!",
    stars: 5,
  },
  {
    name: "Sophia Carter",
    text: "The Article Analysis module is a game changer. I pasted a 12-page blog post and got the key strategies in less than a minute.",
    stars: 5,
  },
  {
    name: "Rohan Patel",
    text: "I love the Competition Tracker — it's like having a market research analyst on my team 24/7!",
    stars: 4,
  },
  {
    name: "Emily Zhang",
    text: "The AI Pitch Deck Builder literally built me a professional deck in 10 minutes. My investors were seriously impressed.",
    stars: 5,
  },
  {
    name: "Liam Johnson",
    text: "The smooth design and animations make the app feel premium. It's not just functional, it's delightful to use.",
    stars: 4,
  },
  {
    name: "Neha Kapoor",
    text: "As a first-time founder, I feel like this app is my secret co-founder. It guides me at every step!",
    stars: 5,
  },
];

export default function Reviews() {
  return (
    <section className="py-20 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.03] via-transparent to-indigo-500/[0.03] blur-3xl" />
      
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            What Founders Are Saying
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Join thousands of founders who've transformed their startup journey
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="rounded-2xl shadow-lg p-6 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all duration-300 bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm hover:-translate-y-1">
                <CardContent className="p-0">
                  {/* Star Ratings */}
                  <div className="flex mb-4">
                    {"⭐".repeat(review.stars)}
                    {"☆".repeat(5 - review.stars)}
                  </div>
                  <p className="text-white/80 mb-4 leading-relaxed">{review.text}</p>
                  <p className="font-semibold text-white/90">— {review.name}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

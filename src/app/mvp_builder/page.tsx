"use client";

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Wand2, ArrowRight, Code, Palette, Zap, Circle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
}: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            className={cn("absolute", className)}
        >
            <motion.div
                animate={{
                    y: [0, 15, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                style={{
                    width,
                    height,
                }}
                className="relative"
            >
                <div
                    className={cn(
                        "absolute inset-0 rounded-full",
                        "bg-gradient-to-r to-transparent",
                        gradient,
                        "backdrop-blur-[2px] border-2 border-white/[0.15]",
                        "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
                        "after:absolute after:inset-0 after:rounded-full",
                        "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
                    )}
                />
            </motion.div>
        </motion.div>
    );
}

export default function MVPBuilderPage() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 1,
            delay: 0.5 + i * 0.2,
            ease: [0.25, 0.4, 0.25, 1],
        },
    }),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      setIsLoading(true);
      try {
        // Store the prompt in sessionStorage for the builder page
        sessionStorage.setItem('mvp_prompt', prompt);
        // Navigate to builder page
        router.push('/mvp_builder/builder');
      } catch (error) {
        console.error('Error starting MVP builder:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030303]">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-indigo-500/[0.15]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />

        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-rose-500/[0.15]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />

        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-violet-500/[0.15]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />

        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-amber-500/[0.15]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8">
              <Circle className="h-2 w-2 fill-blue-500/80" />
              <span className="text-sm text-white/60 tracking-wide">
                AI-Powered MVP Builder
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                Build Your
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-white/90 to-purple-300">
                MVP in Minutes
              </span>
            </h1>

            <p className="text-lg text-white/40 mb-12 leading-relaxed font-light tracking-wide max-w-2xl mx-auto">
              Describe your idea and watch as AI generates a complete, functional web application with live preview.
            </p>
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <div className="text-center p-6 bg-white/[0.02] rounded-xl border border-white/[0.05]">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Code className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Full-Stack Code</h3>
              <p className="text-white/60 text-sm">Complete React application with modern UI components</p>
            </div>

            <div className="text-center p-6 bg-white/[0.02] rounded-xl border border-white/[0.05]">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Live Preview</h3>
              <p className="text-white/60 text-sm">See your app running in real-time with WebContainer</p>
            </div>

            <div className="text-center p-6 bg-white/[0.02] rounded-xl border border-white/[0.05]">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI-Powered</h3>
              <p className="text-white/60 text-sm">Intelligent code generation with best practices</p>
            </div>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-white/[0.03] backdrop-blur-lg border border-white/[0.08] rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Wand2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">
                      Describe Your Application
                    </h2>
                  </div>
                  
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Create a todo app with drag-and-drop functionality, user authentication, and real-time updates..."
                    className="w-full h-40 p-4 bg-white/[0.05] text-white border border-white/[0.1] rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none placeholder-white/40 transition-all duration-300"
                    disabled={isLoading}
                  />
                  
                  <div className="flex items-center gap-4 mt-6">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Code className="w-4 h-4" />
                      <span>React + TypeScript</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Zap className="w-4 h-4" />
                      <span>Live Preview</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Sparkles className="w-4 h-4" />
                      <span>AI Generated</span>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex justify-center"
              >
                <button
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-12 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 disabled:cursor-not-allowed shadow-2xl hover:shadow-blue-500/25"
                >
                  <span className="flex items-center gap-3">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating MVP...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        Generate MVP
                      </>
                    )}
                  </span>
                </button>
              </motion.div>
            </form>
          </motion.div>

          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mt-16"
          >
            <h3 className="text-xl font-semibold text-white mb-8 text-center">
              Example Ideas
            </h3>
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {[
                "A social media dashboard with analytics and post scheduling",
                "An e-commerce platform with inventory management",
                "A project management tool with team collaboration",
                "A fitness tracking app with workout plans and progress charts"
              ].map((example, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPrompt(example)}
                  className="p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl text-left text-white/80 hover:text-white transition-all duration-300 border border-white/[0.05] hover:border-white/[0.1]"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{example}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthDialog() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <>
      <div className="flex gap-3">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            variant="ghost" 
            onClick={() => { setMode("login"); setOpen(true); }}
            className="px-6 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.1] hover:border-white/[0.2] backdrop-blur-sm rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Login
          </Button>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={() => { setMode("signup"); setOpen(true); }}
            className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)]"
          >
            Sign Up
          </Button>
        </motion.div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#030303]/95 backdrop-blur-xl border border-white/[0.1] shadow-[0_25px_50px_rgba(0,0,0,0.5)]">
          <DialogHeader>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                {mode === "login" ? "Welcome Back" : "Join the Community"}
              </DialogTitle>
              <DialogDescription className="text-white/60 mt-2">
                {mode === "login"
                  ? "Sign in to access your AI-powered toolkit."
                  : "Start building your startup with AI assistance."}
              </DialogDescription>
            </motion.div>
          </DialogHeader>

          <motion.div 
            className="grid gap-4 py-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {mode === "signup" && (
              <motion.div 
                className="grid gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Label className="text-white/80 font-medium">Full Name</Label>
                <Input 
                  placeholder="John Doe" 
                  className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20 rounded-xl backdrop-blur-sm"
                />
              </motion.div>
            )}
            
            <motion.div 
              className="grid gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: mode === "signup" ? 0.3 : 0.2 }}
            >
              <Label className="text-white/80 font-medium">Email Address</Label>
              <Input 
                placeholder="you@example.com" 
                type="email"
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20 rounded-xl backdrop-blur-sm"
              />
            </motion.div>
            
            <motion.div 
              className="grid gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: mode === "signup" ? 0.4 : 0.3 }}
            >
              <Label className="text-white/80 font-medium">Password</Label>
              <Input 
                placeholder="••••••••" 
                type="password"
                className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20 rounded-xl backdrop-blur-sm"
              />
            </motion.div>
          </motion.div>

          <DialogFooter>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="w-full"
            >
              <Button 
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] font-semibold"
              >
                {mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

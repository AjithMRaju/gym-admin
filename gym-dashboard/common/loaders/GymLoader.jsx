"use client";

import React from "react";
import { motion } from "framer-motion";

export const GymLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 min-h-[200px] w-full">
      {/* Animated Barbell / Strength Indicator */}
      <div className="flex items-end items-center gap-1.5 h-12">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            initial={{ height: 20, opacity: 0.5 }}
            animate={{ 
              height: [20, 48, 20],
              opacity: [0.5, 1, 0.5] 
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.15,
            }}
            className="w-3 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
          />
        ))}
      </div>

      {/* Responsive Text with Theme-Aware Colors */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-bold tracking-tight text-foreground animate-pulse">
          PREPARING YOUR WORKOUT...
        </h3>
        <p className="text-sm text-muted-foreground max-w-[200px] sm:max-w-none">
          Syncing member data and gym metrics
        </p>
      </div>
    </div>
  );
};

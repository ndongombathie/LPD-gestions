import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function CosmicCard({ title, value, unit, trend, gradient, icon, sparkleCount = 3, glowIntensity = 0.3 }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="relative rounded-2xl p-6 overflow-hidden group"
      style={{ background: gradient }}
    >
      {/* Effet de brillance */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{ 
          background: `radial-gradient(circle at 20% 80%, white, transparent ${glowIntensity * 100}%)` 
        }}
      />
      
      {/* Particules brillantes */}
      {[...Array(sparkleCount)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: [0, Math.random() * 40 - 20],
            y: [0, Math.random() * 40 - 20]
          }}
          transition={{ 
            delay: i * 0.2,
            duration: 3,
            repeat: Infinity,
            repeatDelay: Math.random() * 2
          }}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
          }}
        />
      ))}
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white/80 text-sm font-medium">{title}</div>
          <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
            {React.cloneElement(icon, { className: "w-5 h-5 text-white" })}
          </div>
        </div>
        
        <div className="mb-2">
          <div className="text-3xl font-bold text-white">{value}</div>
          <div className="text-white/60 text-sm">{unit}</div>
        </div>
        
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white/60" />
          <div className={`text-sm font-medium ${
            trend.direction === 'ascending' ? 'text-emerald-300' : 
            trend.direction === 'descending' ? 'text-rose-300' : 'text-amber-300'
          }`}>
            {trend.value} {trend.direction === 'ascending' ? '↗' : trend.direction === 'descending' ? '↘' : '→'}
          </div>
        </div>
      </div>
      
      {/* Bordure animée */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-white/0 group-hover:border-white/20"
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
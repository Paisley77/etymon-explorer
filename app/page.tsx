'use client'

import { StarfieldBackgroundEnhanced } from '@/components/Background/StarfieldBackgroundEnhanced'
import { StarfieldBackground } from '@/components/Background/StarfieldBackground'
import { EtymonCanvasWithProvider } from '@/components/EtymonCanvas/EtymonCanvas'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-ink">
      {/* Starfield background*/}
      {/* <StarfieldBackground /> */}
      <StarfieldBackgroundEnhanced />

      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-left ornament */}
        <motion.div
          initial={{ opacity: 0, rotate: -45 }}
          animate={{ opacity: 0.3, rotate: 0 }}
          transition={{ duration: 1 }}
          className="absolute top-10 left-10 w-32 h-32 border border-gold/20 rounded-full"
        />

        {/* Bottom-right ornament */}
        <motion.div
          initial={{ opacity: 0, rotate: 45 }}
          animate={{ opacity: 0.2, rotate: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="absolute bottom-10 right-10 w-48 h-48 border border-gold/10 rounded-full"
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(#C9A94E 1px, transparent 1px),
                                         linear-gradient(90deg, #C9A94E 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Main canvas */}
      <EtymonCanvasWithProvider />

      {/* Title overlay */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-4 right-4 text-right pointer-events-none z-10"
      >
        <h1 className="relative font-serif text-5xl font-bold tracking-wider">
          <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-gold to-yellow-300">
            Etymon
          </span>
          {/* Glow layers */}
          <span className="absolute inset-0 blur-xl bg-gradient-to-r from-amber-400/40 via-gold/50 to-yellow-400/40 bg-clip-text text-transparent">
            Etymon
          </span>
          <span className="absolute inset-0 blur-2xl bg-gradient-to-r from-amber-300/30 via-gold/40 to-yellow-300/30 bg-clip-text text-transparent">
            Etymon
          </span>
          <span className="absolute inset-0 blur-3xl bg-gradient-to-r from-amber-200/20 via-gold/30 to-yellow-200/20 bg-clip-text text-transparent">
            Etymon
          </span>
        </h1>
        <p className="relative text-parchment/90 text-lg font-mono mt-2 italic tracking-wide">
          <span className="relative z-10">See how words evolve across 1000 years</span>
          {/* Subtle glow for the tagline */}
          <span className="absolute inset-0 blur-md bg-gradient-to-r from-parchment/30 via-white/20 to-parchment/30 bg-clip-text text-transparent">
            See how words evolve across 1000 years
          </span>
        </p>
      </motion.div>

      {/* Loading state for initial load */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute inset-0 bg-ink pointer-events-none z-50"
      />
    </main>
  )
}
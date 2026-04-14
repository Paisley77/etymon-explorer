'use client'

import { useEtymonStore } from '@/lib/store/etymonStore'
import { motion } from 'framer-motion'

const historicalEras = [
    { year: 1200, label: '1200 CE', era: 'Middle English' },
    { year: 1350, label: '1350 CE', era: 'Late Middle English' },
    { year: 1500, label: '1500 CE', era: 'Early Modern English' },
    { year: 1650, label: '1650 CE', era: 'Shakespearean English' },
    { year: 1800, label: '1800 CE', era: 'Late Modern English' },
    { year: 2000, label: 'Present', era: 'Contemporary English' },
    { year: 2026, label: '', era: '' }
]

export function TimeSlider() {
    const { timeSliderValue, setTimeSlider } = useEtymonStore()

    const currentEra = historicalEras[Math.floor(timeSliderValue * (historicalEras.length - 1))]

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="relative"
        >
            {/* Era label */}
            <div className="absolute -top-8 left-0 right-0 text-center">
                <span className="text-gold font-serif text-sm tracking-wider">
                    {currentEra.era} · {currentEra.label}
                </span>
            </div>

            {/* Slider container */}
            <div className="relative px-4 py-6 bg-parchment/5 backdrop-blur-md rounded-full border border-gold/30">
                {/* Timeline track */}
                <div className="relative h-1 bg-gradient-to-r from-amber-900 via-gold to-parchment rounded-full">
                    {/* Progress fill */}
                    <motion.div
                        className="absolute h-full bg-gold rounded-full"
                        style={{ width: `${timeSliderValue * 100}%` }}
                    />

                    {/* Era markers */}
                    {historicalEras.map((era, index) => {
                        const position = index / (historicalEras.length - 1)
                        return (
                            <div
                                key={era.year}
                                className="absolute top-1/2 -translate-y-1/2"
                                style={{ left: `${position * 100}%` }}
                            >
                                <div className="w-2 h-2 rounded-full bg-parchment border border-gold" />
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                    <span className="text-[10px] text-parchment/60 font-mono">
                                        {era.year}
                                    </span>
                                </div>
                            </div>
                        )
                    })}

                    {/* Slider thumb */}
                    <motion.input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={timeSliderValue}
                        onChange={(e) => setTimeSlider(parseFloat(e.target.value))}
                        className="absolute top-1/2 -translate-y-1/2 w-full h-4 opacity-0 cursor-pointer"
                        style={{ margin: 0 }}
                    />

                    <motion.div
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 -ml-2.5 rounded-full bg-gold border-2 border-parchment shadow-lg cursor-pointer"
                        style={{ left: `${timeSliderValue * 100}%` }}
                        animate={{
                            boxShadow: [
                                '0 0 0 0 rgba(201, 169, 78, 0.4)',
                                '0 0 0 10px rgba(201, 169, 78, 0)',
                                '0 0 0 0 rgba(201, 169, 78, 0)'
                            ]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>
            </div>

            {/* Time period description */}
            <motion.div
                key={currentEra.era}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute left-0 -top-2 text-left"
            >
                <span className="text-gold/80 text-sm font-serif italic tracking-wide">
                    {getEraDescription(currentEra.era)}
                </span>
            </motion.div>
        </motion.div>
    )
}

function getEraDescription(era: string): string {
    const descriptions: Record<string, string> = {
        'Middle English': 'Chaucer · Canterbury Tales · Great Vowel Shift begins',
        'Late Middle English': 'Printing press · Standardization begins',
        'Early Modern English': 'Renaissance · King James Bible · Spelling variation',
        'Shakespearean English': 'Shakespeare · Sonnets · thee & thou',
        'Late Modern English': 'Industrial Revolution · Global expansion',
        'Contemporary English': 'Internet age · Global lingua franca'
    }
    return descriptions[era] || ''
}
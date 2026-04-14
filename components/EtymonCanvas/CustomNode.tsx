'use client'

import { memo, useEffect, useState } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { useEtymonStore } from '@/lib/store/etymonStore'

interface CustomNodeData {
    word: string
    language: string
    era: string
    definition: string
    metadata: {
        firstRecorded?: number
        frequency?: number
        partOfSpeech: string
    }
    isSelected: boolean
}

const eraColors: Record<string, { border: string; glow: string }> = {
    ancient: { border: '#8B6914', glow: 'rgba(139, 105, 20, 0.3)' },
    medieval: { border: '#C9A94E', glow: 'rgba(201, 169, 78, 0.3)' },
    earlyModern: { border: '#D4AF37', glow: 'rgba(212, 175, 55, 0.3)' },
    modern: { border: '#E8D5A5', glow: 'rgba(232, 213, 165, 0.3)' }
}

const languageIcons: Record<string, string> = {
    'Latin': '🏛️',
    'Greek': '🏺',
    'Old English': '⚔️',
    'Middle English': '📜',
    'Modern English': '📖',
    'Proto-Germanic': 'ᚱ',
    'Old Norse': '🪓',
    'Proto-Indo-European': '🌍'
}

interface SoundChangeRule {
    pattern: RegExp
    replacement: string
    description: string
}

const historicalSoundChanges: Record<string, SoundChangeRule[]> = {
    // Proto-Indo-European to Proto-Germanic (Grimm's Law)
    pie_to_germanic: [
        { pattern: /p/g, replacement: 'f', description: "p → f (Grimm's Law)" },
        { pattern: /t/g, replacement: 'θ', description: "t → θ (Grimm's Law)" },
        { pattern: /k/g, replacement: 'x', description: "k → x (Grimm's Law)" },
        { pattern: /b/g, replacement: 'p', description: "b → p" },
        { pattern: /d/g, replacement: 't', description: "d → t" },
        { pattern: /g/g, replacement: 'k', description: "g → k" },
    ],

    // Proto-Germanic to Old English
    germanic_to_oldEnglish: [
        { pattern: /sk/g, replacement: 'sc', description: "sk → sc" },
        { pattern: /θ/g, replacement: 'þ', description: "θ → þ (thorn)" },
        { pattern: /x/g, replacement: 'h', description: "x → h" },
        { pattern: /ai/g, replacement: 'ā', description: "ai → ā" },
        { pattern: /au/g, replacement: 'ēa', description: "au → ēa" },
    ],

    // Old English to Middle English
    oldEnglish_to_middleEnglish: [
        { pattern: /þ/g, replacement: 'th', description: "þ → th" },
        { pattern: /ð/g, replacement: 'th', description: "ð → th" },
        { pattern: /ā/g, replacement: 'o', description: "ā → o (Great Vowel Shift begins)" },
        { pattern: /ē/g, replacement: 'e', description: "ē → e" },
        { pattern: /ī/g, replacement: 'i', description: "ī → i" },
        { pattern: /hw/g, replacement: 'wh', description: "hw → wh" },
        { pattern: /cw/g, replacement: 'qu', description: "cw → qu (Norman influence)" },
    ],

    // Middle English to Early Modern English
    middleEnglish_to_earlyModern: [
        { pattern: /e$/g, replacement: '', description: "Final -e becomes silent" },
        { pattern: /gh/g, replacement: 'f', description: "gh → f (in some words)" },
        { pattern: /ou/g, replacement: 'ow', description: "ou → ow" },
        { pattern: /ie/g, replacement: 'y', description: "ie → y" },
    ],

    // Early Modern to Modern English
    earlyModern_to_modern: [
        { pattern: /f$/g, replacement: 've', description: "Final f → ve" },
        { pattern: /s$/g, replacement: 'se', description: "Final s → se" },
        { pattern: /ck$/g, replacement: 'c', description: "ck → c" },
        { pattern: /our/g, replacement: 'or', description: "our → or (American spelling)" },
    ],
}

const historicalFormsCache: Record<string, Record<string, string>> = {
    // Common words with known historical spellings
    knight: {
        pie: '*knegʰtos',
        protoGermanic: '*knehtaz',
        oldEnglish: 'cniht',
        middleEnglish: 'knyght',
        earlyModern: 'knight',
        modern: 'knight',
    },
    queen: {
        pie: '*gʷḗn',
        protoGermanic: '*kwēniz',
        oldEnglish: 'cwēn',
        middleEnglish: 'quene',
        earlyModern: 'queen',
        modern: 'queen',
    },
}

export const CustomNode = memo(({ data, id, selected }: NodeProps) => {
    const nodeData = data as unknown as CustomNodeData
    const { nodes, edges, highlightedPathIds, timeSliderValue, selectedNodeIds } = useEtymonStore()
    const [displayWord, setDisplayWord] = useState(nodeData.word)
    const [isNew, setIsNew] = useState(true)
    const controls = useAnimation()
    const [morphDescription, setMorphDescription] = useState('')
    const colors = eraColors[nodeData.era] || eraColors.modern
    const icon = languageIcons[nodeData.language] || '📝'
    const isHighlighted = highlightedPathIds?.nodes.includes(id)
    const isSelectedInTree = selectedNodeIds.has(id)


    // Scribble animation for new nodes
    useEffect(() => {
        if (isNew) {
            const period = 200
            const word = nodeData.word
            let currentIndex = 0
            const interval = setInterval(() => {
                if (currentIndex <= word.length) {
                    setDisplayWord(word.slice(0, currentIndex))
                    currentIndex++
                } else {
                    clearInterval(interval)
                }
            }, period)

            controls.start({
                pathLength: 1,
                transition: { duration: word.length * (period / 100), ease: "easeInOut" }
            })

            const timer = setTimeout(() => setIsNew(false), word.length * period + 500)
            return () => {
                clearInterval(interval)
                clearTimeout(timer)
            }
        }
    }, [isNew, controls])


    // Advanced historical spelling morphing based on time slider and etymology
    useEffect(() => {
        applyHistoricalSpelling()
    }, [timeSliderValue, nodeData.word, nodeData.era, nodeData.language])

    const applyHistoricalSpelling = () => {
        // Check if we have cached historical forms for this word
        const cachedForms = historicalFormsCache[nodeData.word.toLowerCase()]

        if (cachedForms) {
            // Use known historical forms
            if (timeSliderValue < 0.1) {
                setDisplayWord(cachedForms.pie || cachedForms.protoGermanic || nodeData.word)
                setMorphDescription('Proto-Indo-European root')
            } else if (timeSliderValue < 0.25) {
                setDisplayWord(cachedForms.protoGermanic || cachedForms.oldEnglish || nodeData.word)
                setMorphDescription('Proto-Germanic form')
            } else if (timeSliderValue < 0.4) {
                setDisplayWord(cachedForms.oldEnglish || nodeData.word)
                setMorphDescription('Old English (Anglo-Saxon)')
            } else if (timeSliderValue < 0.6) {
                setDisplayWord(cachedForms.middleEnglish || nodeData.word)
                setMorphDescription('Middle English (Chaucer)')
            } else if (timeSliderValue < 0.8) {
                setDisplayWord(cachedForms.earlyModern || nodeData.word)
                setMorphDescription('Early Modern English (Shakespeare)')
            } else {
                setDisplayWord(nodeData.word)
                setMorphDescription('Modern English')
            }
            return
        }

        // No cached forms - apply sound change rules based on etymology
        let morphedWord = nodeData.word
        let description = ''

        // Trace back through etymology to find oldest form
        const etymologyChain = getEtymologyChain(id)

        if (etymologyChain.length > 0) {
            const oldestForm = etymologyChain[0]

            if (timeSliderValue < 0.1) {
                // Show oldest known form
                morphedWord = oldestForm
                description = `Earliest recorded form: ${oldestForm}`
            } else if (timeSliderValue < 0.25) {
                // Apply sound changes forward
                morphedWord = applySoundChanges(oldestForm, timeSliderValue)
                description = 'Reconstructed intermediate form'
            } else if (timeSliderValue < 0.4) {
                // Middle period
                morphedWord = applySoundChanges(oldestForm, timeSliderValue)
                description = 'Middle period form'
            } else if (timeSliderValue < 0.6) {
                // Late middle period
                morphedWord = applySoundChanges(oldestForm, timeSliderValue)
                description = 'Late Middle form'
            } else if (timeSliderValue < 0.8) {
                // Early modern
                morphedWord = applySoundChanges(oldestForm, timeSliderValue)
                description = 'Early modern form'
            } else {
                morphedWord = nodeData.word
                description = 'Modern spelling'
            }
        } else {
            // Fallback: apply generic rules based on language
            morphedWord = applyGenericRules(nodeData.word, nodeData.language, timeSliderValue)
            description = `${getEraName(timeSliderValue)} spelling`
        }

        setDisplayWord(morphedWord)
        setMorphDescription(description)
    }

    const getEtymologyChain = (nodeId: string): string[] => {
        const chain: string[] = []
        let currentId = nodeId

        while (currentId) {
            const node = nodes.get(currentId)
            if (node) {
                chain.unshift(node.word)
            }

            // Find parent edge
            const parentEdge = Array.from(edges.values()).find(
                edge => edge.target === currentId && edge.relationshipType === 'derivedFrom'
            )

            currentId = parentEdge?.source || ''

            if (chain.includes(currentId)) {
                break
            }
        }

        return chain
    }

    // Apply sound change rules progressively
    const applySoundChanges = (word: string, progress: number): string => {
        let result = word

        // Apply rules in historical order based on progress
        if (progress >= 0) {
            historicalSoundChanges.pie_to_germanic?.forEach(rule => {
                result = result.replace(rule.pattern, rule.replacement)
            })
        }
        if (progress >= 0.1) {
            historicalSoundChanges.germanic_to_oldEnglish?.forEach(rule => {
                result = result.replace(rule.pattern, rule.replacement)
            })
        }
        if (progress >= 0.25) {
            historicalSoundChanges.oldEnglish_to_middleEnglish?.forEach(rule => {
                result = result.replace(rule.pattern, rule.replacement)
            })
        }
        if (progress >= 0.4) {
            historicalSoundChanges.middleEnglish_to_earlyModern?.forEach(rule => {
                result = result.replace(rule.pattern, rule.replacement)
            })
        }
        if (progress >= 0.6) {
            historicalSoundChanges.earlyModern_to_modern?.forEach(rule => {
                result = result.replace(rule.pattern, rule.replacement)
            })
        }

        return result
    }

    // Generic fallback rules
    const applyGenericRules = (word: string, language: string, progress: number): string => {
        if (language.includes('Old English') && progress < 0.4) {
            return word
                .replace(/th/g, 'þ')
                .replace(/sh/g, 'sc')
                .replace(/qu/g, 'cw')
                .replace(/k/g, 'c')
        }
        if (language.includes('Middle English') && progress < 0.6) {
            return word
                .replace(/gh/g, 'ȝ')
                .replace(/y/g, 'i')
                .replace(/ou/g, 'ow')
        }
        return word
    }

    const getEraName = (value: number): string => {
        if (value < 0.1) return 'Ancient'
        if (value < 0.25) return 'Old English'
        if (value < 0.4) return 'Middle English'
        if (value < 0.6) return 'Late Middle'
        if (value < 0.8) return 'Early Modern'
        return 'Modern'
    }

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative group"
        >
            {/* Glow effect */}
            <motion.div
                className="absolute -inset-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`
                }}
                animate={selected ? { opacity: 0.8 } : { opacity: 0 }}
            />

            {/* Scribble effect for new nodes */}
            <AnimatePresence>
                {isNew && (
                    <motion.svg
                        className="absolute -bottom-2 left-0 w-full h-4 pointer-events-none"
                        viewBox="0 0 100 10"
                        preserveAspectRatio="none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Handwriting underline - wavy like real penmanship */}
                        <motion.path
                            d="M 5,5 Q 15,2 25,5 T 45,5 T 65,5 T 85,5 T 95,5"
                            fill="none"
                            stroke="#C9A94E"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={controls}
                        />
                        {/* Small flourish at the end */}
                        <motion.path
                            d="M 90,5 Q 95,3 98,2"
                            fill="none"
                            stroke="#C9A94E"
                            strokeWidth="1"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={controls}
                            transition={{ delay: 0.3 }}
                        />
                    </motion.svg>
                )}
            </AnimatePresence>

            {/* Main node */}
            <div
                className={`
                    relative px-6 py-3 rounded-lg
                    bg-parchment/10 backdrop-blur-sm
                    border-2
                    transition-all duration-300
                    cursor-pointer
                    ${selected ? 'scale-110 shadow-2xl' : 'hover:scale-105'}
                    ${isHighlighted ? 'scale-110 shadow-2xl' : 'hover:scale-105'}
                    ${isSelectedInTree ? '!ring-2 !ring-gold !ring-offset-2 !ring-offset-ink !shadow-lg !shadow-gold/30' : 'hover:scale-105'}
                `}
                style={{
                    borderColor: colors.border,
                    boxShadow: selected ? `0 0 20px ${colors.glow}` : 'none'
                }}
            >
                {/* Handles for connections */}
                <Handle
                    type="target"
                    position={Position.Top}
                    className="!w-3 !h-3 !bg-gold !border-2 !border-parchment"
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="!w-3 !h-3 !bg-gold !border-2 !border-parchment"
                />

                {/* Content */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-lg">{icon}</span>
                        <span className="font-serif text-xl font-semibold text-parchment">
                            {displayWord}
                        </span>
                    </div>

                    <div className="text-xs text-gold/80 font-mono">
                        {nodeData.language} · {nodeData.metadata.partOfSpeech}
                    </div>

                    {nodeData.metadata.firstRecorded && (
                        <div className="text-xs text-parchment/50 mt-1 font-serif italic">
                            First recorded: {Math.abs(nodeData.metadata.firstRecorded)}
                            {nodeData.metadata.firstRecorded < 0 ? ' BCE' : ' CE'}
                        </div>
                    )}
                </div>

                {/* Show morphing description on hover */}
                <div className="text-xs text-gold/60 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {morphDescription}
                </div>

                {/* Frequency indicator */}
                {nodeData.metadata.frequency && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gold"
                        style={{ opacity: nodeData.metadata.frequency }}
                    />
                )}
            </div>
        </motion.div>
    )
})

CustomNode.displayName = 'CustomNode'
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Clock, Hand, ArrowRight, Share2, Maximize2 } from 'lucide-react'
import { useEtymonStore } from '@/lib/store/etymonStore'
import { EtymologyPath } from '@/types/etymon.types'

interface NodeDetailsPanelProps {
    nodeId: string
    onClose: () => void
}

export function NodeDetailsPanel({ nodeId, onClose }: NodeDetailsPanelProps) {
    const { nodes, edges, setHighlightedPathIds, findPath, selectConnectedComponent } = useEtymonStore()
    const [relatedWords, setRelatedWords] = useState<any[]>([])
    const [etymologyPath, setEtymologyPath] = useState<string[]>([])
    const [descendants, setDescendants] = useState<any[]>([])
    const [loadingDescendants, setLoadingDescendants] = useState(false)
    const [showDescendants, setShowDescendants] = useState(false)
    const [pathfindingMode, setPathfindingMode] = useState(false)
    const [pathResult, setPathResult] = useState<EtymologyPath | null>(null)
    const [targetWord, setTargetWord] = useState<string>("")
    const [showPathModal, setShowPathModal] = useState(false)

    const node = nodes.get(nodeId)

    useEffect(() => {
        if (node) {
            loadRelatedWords()
            loadEtymologyChain()
            setDescendants([])
            setLoadingDescendants(false)
            setShowDescendants(false)
            setPathfindingMode(false)
            setShowPathModal(false)
        }
    }, [node])

    const loadRelatedWords = async () => {
        // Get all edges connected to this node
        const connectedEdges = Array.from(edges.values()).filter(
            edge => edge.source === nodeId || edge.target === nodeId
        )

        // Get related word IDs
        const relatedIds = connectedEdges.map(edge =>
            edge.source === nodeId ? edge.target : edge.source
        )

        // Fetch word details
        const words = []
        for (const id of relatedIds.slice(0, 5)) {
            const word = nodes.get(id)
            if (word) {
                words.push(word)
            }
        }

        setRelatedWords(words)
    }

    const loadEtymologyChain = async () => {
        // Build chain of ancestors
        const chain: string[] = []
        let currentId = nodeId

        while (currentId && chain.length < 10) {
            const currentNode = nodes.get(currentId)
            if (!currentNode) break

            chain.unshift(currentNode.word)

            // Find parent (ancestor)
            const parentEdge = Array.from(edges.values()).find(
                edge => edge.target === currentId && edge.relationshipType === 'derivedFrom'
            )

            currentId = parentEdge?.source || ''
        }

        setEtymologyPath(chain)
    }

    const loadDescendants = async () => {
        if (!node) return

        setLoadingDescendants(true)

        try {
            // Get edges where this node is the source (descendants)
            const descendantEdges = Array.from(edges.values()).filter(
                edge => edge.source === nodeId && edge.relationshipType === 'derivedFrom'
            )

            // Get descendant word details
            const descendantWords = []
            for (const edge of descendantEdges) {
                const word = nodes.get(edge.target)
                if (word) {
                    descendantWords.push({
                        ...word,
                        relationshipType: edge.relationshipType,
                        confidence: edge.confidence,
                        yearOfTransition: edge.yearOfTransition
                    })
                }
            }

            // If no descendants in store, try to fetch from API
            // if (descendantWords.length === 0) {
            //     await exploreWord(node.word)
            //     for (const edge of descendantEdges) {
            //         const word = nodes.get(edge.target)
            //         if (word) {
            //             descendantWords.push({
            //                 ...word,
            //                 relationshipType: edge.relationshipType,
            //                 confidence: edge.confidence,
            //                 yearOfTransition: edge.yearOfTransition
            //             })
            //         }
            //     }
            // }

            setDescendants(descendantWords)
            setShowDescendants(true)
        } catch (error) {
            console.error('Failed to load descendants:', error)
        } finally {
            setLoadingDescendants(false)
        }
    }

    const handleFindPath = async () => {
        if (!node || !targetWord.trim()) return

        setLoadingDescendants(true)
        setPathResult(null)

        try {
            const targetNode = Array.from(nodes.values()).find(
                n => n.word.toLowerCase() === targetWord.toLowerCase()
            )

            if (!targetNode) {
                alert(`"${targetWord}" not found in the current graph. Try exploring it first!`)
                return
            }
            const path = await findPath(nodeId, targetNode.id)
            if (path) {
                setPathResult(path)
                // Highlight the path on canvas
                setHighlightedPathIds({
                    nodes: path.path,
                    edges: path.edges
                })
            } else {
                alert(`No etymological connection found between "${node.word}" and "${targetNode.word}"`)
            }
        } catch (error) {
            console.error('Failed to find path:', error)
        } finally {
            setLoadingDescendants(false)
        }
    }

    const clearPathHighlight = () => {
        setHighlightedPathIds({ nodes: [], edges: [] })
    }

    if (!node) return null

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 30 }}
            className="
                absolute top-4 right-4 bottom-4 w-96
                bg-ink/95 backdrop-blur-xl
                border border-gold/30
                rounded-2xl
                shadow-2xl shadow-black/50
                overflow-hidden
                z-20
            "
        >
            {/* Header with gradient */}
            <div className="relative p-6 bg-gradient-to-b from-gold/10 to-transparent">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-parchment/40 hover:text-parchment transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Word title */}
                <div className="flex items-start gap-3 mb-2">
                    <div className="text-4xl">
                        {getLanguageEmoji(node.language)}
                    </div>
                    <div>
                        <h2 className="font-serif text-3xl text-gold mb-1">
                            {node.word}
                        </h2>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-1 bg-parchment/10 rounded-full text-parchment/80 text-xs">
                                {node.language}
                            </span>
                            <span className="text-parchment/40">•</span>
                            <span className="text-parchment/60 text-xs capitalize">
                                {node.metadata.partOfSpeech}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="flex gap-4 mt-4">
                    {node.metadata.firstRecorded && (
                        <div className="flex items-center gap-1 text-xs text-parchment/60">
                            <Clock className="w-3 h-3" />
                            {Math.abs(node.metadata.firstRecorded)}
                            {node.metadata.firstRecorded < 0 ? ' BCE' : ' CE'}
                        </div>
                    )}
                    {node.metadata.frequency && (
                        <div className="flex items-center gap-1 text-xs text-parchment/60">
                            <BookOpen className="w-3 h-3" />
                            Usage: {(node.metadata.frequency * 100).toFixed(0)}%
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-250px)]">
                {/* Definition */}
                <div>
                    <h3 className="text-xs font-mono text-gold/60 uppercase tracking-wider mb-2">
                        Definition
                    </h3>
                    <p className="text-parchment/90 font-serif leading-relaxed">
                        {node.definition}
                    </p>
                </div>

                {/* Etymology */}
                <div>
                    <h3 className="text-xs font-mono text-gold/60 uppercase tracking-wider mb-2">
                        Etymology
                    </h3>
                    <div className="text-parchment/80 text-sm leading-relaxed">
                        {node.etymology || 'Etymology not available'}
                    </div>
                </div>

                {/* Etymology chain */}
                {etymologyPath.length >= 1 && (
                    <div>
                        <h3 className="text-xs font-mono text-gold/60 uppercase tracking-wider mb-2">
                            Evolution Chain
                        </h3>
                        <div className="flex items-center flex-wrap gap-2">
                            {etymologyPath.map((word, index) => (
                                <div key={index} className="flex items-center">
                                    <span className="font-serif text-parchment">
                                        {word}
                                    </span>
                                    {index < etymologyPath.length - 1 && (
                                        <ArrowRight className="w-3 h-3 text-gold/40 mx-1" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Related words */}
                {relatedWords.length > 0 && (
                    <div>
                        <h3 className="text-xs font-mono text-gold/60 uppercase tracking-wider mb-2">
                            Related Words
                        </h3>
                        <div className="space-y-2">
                            {relatedWords.map((word) => (
                                <motion.button
                                    key={word.id}
                                    whileHover={{ x: 4 }}
                                    className="
                                        w-full p-3
                                        bg-parchment/5
                                        border border-gold/20
                                        rounded-lg
                                        text-left
                                        hover:bg-parchment/10 hover:border-gold/40
                                        transition-all
                                        group
                                    "
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-serif text-parchment group-hover:text-gold transition-colors">
                                                {word.word}
                                            </div>
                                            <div className="text-xs text-parchment/50">
                                                {word.language}
                                            </div>
                                        </div>
                                        <Maximize2 className="w-4 h-4 text-parchment/30 group-hover:text-gold/60 transition-colors" />
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Show descendants */}
                {showDescendants && descendants.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <h3 className="text-xs font-mono text-gold/60 uppercase tracking-wider mb-2">
                            Descendants ({descendants.length})
                        </h3>
                        <div className="space-y-2">
                            {
                                descendants.map((word) => (
                                    <motion.button
                                        key={word.id}
                                        whileHover={{ x: 4 }}
                                        onClick={() => useEtymonStore.getState().selectNode(word.id)}
                                        className="
                                            w-full p-3
                                            bg-parchment/5
                                            border border-gold/20
                                            rounded-lg
                                            text-left
                                            hover:bg-parchment/10 hover:border-gold/40
                                            transition-all
                                            group
                                        "
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-serif text-parchment group-hover:text-gold transition-colors">
                                                    {word.word}
                                                </div>
                                                <div className="text-xs text-parchment/50">
                                                    {word.language} • {word.metadata?.partOfSpeech || 'noun'}
                                                </div>
                                            </div>
                                            <Maximize2 className="w-4 h-4 text-parchment/30 group-hover:text-gold/60 transition-colors" />
                                        </div>
                                    </motion.button>
                                ))
                            }
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Footer actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-ink to-transparent">
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            selectConnectedComponent(nodeId)
                            onClose() // Close panel to show the selection handle
                        }}
                        className="
                            flex-1 py-2
                            bg-gradient-to-r from-gold/10 to-gold/5
                            border border-gold/40
                            rounded-lg
                            text-gold/80 text-sm font-serif
                            hover:from-gold/20 hover:to-gold/10 hover:text-gold
                            transition-all
                            flex items-center justify-center gap-1
                        "
                    >
                        <Hand className="w-3 h-3" />
                        Select Tree
                    </button>
                    {/* <button className="
                        flex-1 py-2
                        bg-parchment/5
                        border border-gold/30
                        rounded-lg
                        text-parchment/70 text-sm
                        hover:bg-parchment/10 hover:text-parchment
                        transition-all
                        flex items-center justify-center gap-2
                    ">
                        <Share2 className="w-4 h-4" />
                        Share
                    </button> */}
                    <button
                        onClick={loadDescendants}
                        disabled={loadingDescendants}
                        className="
                            flex-1 py-2
                            bg-gradient-to-r from-gold/20 to-gold/10
                            border border-gold/50
                            rounded-lg
                            text-gold text-sm font-serif
                            hover:from-gold/30 hover:to-gold/20
                            transition-all
                        "
                    >
                        {loadingDescendants ? 'Loading...' : 'Explore Branch'}
                    </button>
                    <button
                        onClick={() => {
                            setShowPathModal(true)
                            setTargetWord('')
                            setPathResult(null)
                        }}
                        className="
                            flex-1 py-2
                            bg-gradient-to-r from-copper/20 to-copper/10
                            border border-copper/50
                            rounded-lg
                            text-copper text-sm font-serif
                            hover:from-copper/30 hover:to-copper/20
                            transition-all
                        "
                    >
                        Find Path
                    </button>
                </div>
            </div>

            {/* Pathfinding Modal */}
            <AnimatePresence>
                {showPathModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-ink/80 backdrop-blur-sm z-30 flex items-center justify-center"
                        onClick={() => setShowPathModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-96 p-6 bg-ink-light border border-gold/30 rounded-2xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-gold font-serif text-lg">Find Etymology Path</h3>
                                <button
                                    onClick={() => {
                                        setShowPathModal(false)
                                        clearPathHighlight()
                                    }}
                                    className="text-parchment/40 hover:text-parchment"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <p className="text-xs text-parchment/60 mb-1">From:</p>
                                <div className="px-3 py-2 bg-parchment/5 border border-gold/30 rounded-lg">
                                    <span className="text-gold font-serif">{node.word}</span>
                                    <span className="text-parchment/50 text-xs ml-2">({node.language})</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <p className="text-xs text-parchment/60 mb-1">To:</p>
                                <input
                                    type="text"
                                    value={targetWord}
                                    onChange={(e) => setTargetWord(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFindPath()}
                                    placeholder="Enter a word..."
                                    className="w-full px-3 py-2 bg-parchment/5 border border-gold/30 rounded-lg text-parchment placeholder-parchment/30 focus:border-gold focus:outline-none"
                                    autoFocus
                                />
                            </div>

                            {/* Word suggestions */}
                            <div className="mb-4">
                                <p className="text-xs text-parchment/40 mb-1">Words in graph:</p>
                                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1">
                                    {Array.from(nodes.values())
                                        .filter(n => n.id !== nodeId)
                                        .slice(0, 11)
                                        .map(n => (
                                            <button
                                                key={n.id}
                                                onClick={() => setTargetWord(n.word)}
                                                className="px-2 py-1 text-xs bg-parchment/5 border border-gold/20 rounded text-parchment/70 hover:bg-parchment/10 hover:text-parchment transition-colors"
                                            >
                                                {n.word}
                                            </button>
                                        ))
                                    }
                                </div>
                            </div>

                            {/* Path Result */}
                            {pathResult && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-4 p-3 bg-gold/5 border border-gold/30 rounded-lg"
                                >
                                    <p className="text-xs text-gold/80 mb-2">Connection Found!</p>
                                    <div className="flex flex-wrap items-center gap-1">
                                        {pathResult.path.map((wordId, i) => {
                                            const word = nodes.get(wordId)
                                            return (
                                                <span key={wordId} className="flex items-center">
                                                    <span className="text-parchment text-sm font-serif">
                                                        {word?.word || wordId.slice(0, 6)}
                                                    </span>
                                                    {i < pathResult.path.length - 1 && (
                                                        <ArrowRight className="w-3 h-3 text-white mx-1 drop-shadow-[0_0_4px_rgba(201,169,78,0.8)]" />
                                                    )}
                                                </span>
                                            )
                                        })}
                                    </div>
                                    {pathResult.explanation && (
                                        <p className="text-xs text-parchment/60 mt-2 italic">
                                            {pathResult.explanation}
                                        </p>
                                    )}
                                </motion.div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setShowPathModal(false)
                                        clearPathHighlight()
                                    }}
                                    className="flex-1 py-2 bg-parchment/5 border border-gold/30 rounded-lg text-parchment/70 hover:bg-parchment/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFindPath}
                                    disabled={pathfindingMode || !targetWord.trim()}
                                    className="flex-1 py-2 bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/50 rounded-lg text-gold font-serif hover:from-gold/30 hover:to-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {pathfindingMode ? 'Finding...' : 'Find Path'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

function getLanguageEmoji(language: string): string {
    const emojis: Record<string, string> = {
        'Latin': '🏛️',
        'Greek': '🏺',
        'Old English': '⚔️',
        'Middle English': '📜',
        'Modern English': '📖',
        'Proto-Germanic': 'ᚱ',
        'Old Norse': '🪓',
        'Proto-Indo-European': '🌍'
    }
    return emojis[language] || '📝'
}
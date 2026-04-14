'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Sparkles, History, TrendingUp } from 'lucide-react'

interface SearchBarProps {
    onSearch: (word: string) => void
    isLoading: boolean
}

// Common English words for suggestions
const SUGGESTIONS = [
    { word: 'etymology', category: 'Linguistics' },
    { word: 'democracy', category: 'Politics' },
    { word: 'topology', category: 'Mathematics' },
    { word: 'algorithm', category: 'Computer Science' },
    { word: 'thermodynamics', category: 'Physics' },
    { word: 'violin', category: 'Music' },
    { word: 'philosophy', category: 'Philosophy' },
    { word: 'serendipity', category: 'Literature' },
    { word: 'quintessential', category: 'Common' }
]

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
    const [query, setQuery] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const [suggestions, setSuggestions] = useState<typeof SUGGESTIONS>([])
    const inputRef = useRef<HTMLInputElement>(null)

    // Load recent searches from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('etymon-recent-searches')
        if (stored) {
            setRecentSearches(JSON.parse(stored).slice(0, 5))
        }
    }, [])

    // Filter suggestions based on query
    useEffect(() => {
        if (query.length > 0) {
            const filtered = SUGGESTIONS.filter(s =>
                s.word.toLowerCase().includes(query.toLowerCase())
            )
            setSuggestions(filtered)
        } else {
            setSuggestions([])
        }
    }, [query])

    const handleSearch = (word: string) => {
        if (word.trim()) {
            // Save to recent searches
            const updated = [word, ...recentSearches.filter(s => s !== word)].slice(0, 5)
            setRecentSearches(updated)
            localStorage.setItem('etymon-recent-searches', JSON.stringify(updated))
            onSearch(word.trim())
            setQuery('')
            setIsFocused(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && query.trim()) {
            handleSearch(query)
        }
        if (e.key === 'Escape') {
            setIsFocused(false)
        }
    }

    return (
        <div className="relative">
            {/* AI-powered hint */}
            <AnimatePresence>
                {!isFocused && !query && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute -bottom-8 left-4"
                    >
                        <span className="text-[20px] font-mono text-gold/80 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-gold" />
                            AI-powered Etymology Search
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search input */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`
                    relative flex items-center
                    bg-parchment/5 backdrop-blur-xl
                    border rounded-full
                    transition-all duration-300
                    ${isFocused
                        ? 'border-gold shadow-lg shadow-gold/20 scale-105'
                        : 'border-gold/30 hover:border-gold/50'
                    }
                `}
            >
                {/* Search icon */}
                <div className="pl-4">
                    {isLoading ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <Sparkles className="w-5 h-5 text-gold" />
                        </motion.div>
                    ) : (
                        <Search className="w-5 h-5 text-gold/60" />
                    )}
                </div>

                {/* Input field */}
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter an English word..."
                    className="
                        w-64 px-4 py-3
                        bg-transparent
                        text-parchment placeholder-parchment/30
                        font-serif text-lg
                        outline-none
                    "
                    disabled={isLoading}
                />

                {/* Clear button */}
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="pr-3 text-parchment/40 hover:text-parchment transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                {/* Search button */}
                <button
                    onClick={() => handleSearch(query)}
                    disabled={!query.trim() || isLoading}
                    className="
                        px-4 py-3
                        bg-gradient-to-r from-gold/20 to-gold/10
                        border-l border-gold/30
                        rounded-r-full
                        text-gold font-serif text-sm
                        hover:from-gold/30 hover:to-gold/20
                        disabled:opacity-30 disabled:cursor-not-allowed
                        transition-all duration-300
                    "
                >
                    Explore
                </button>
            </motion.div>

            {/* Dropdown suggestions */}
            <AnimatePresence>
                {isFocused && (query || recentSearches.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="
                            absolute top-full left-0 right-0 mt-2
                            bg-ink/95 backdrop-blur-xl
                            border border-gold/30
                            rounded-2xl
                            shadow-2xl shadow-black/50
                            overflow-hidden
                            z-50
                        "
                    >
                        {/* Suggestions list */}
                        {query && suggestions.length > 0 && (
                            <div className="p-2">
                                <div className="px-3 py-2 text-xs font-mono text-gold/60 uppercase tracking-wider">
                                    Suggestions
                                </div>
                                {suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion.word}
                                        onClick={() => handleSearch(suggestion.word)}
                                        className="
                                            w-full px-4 py-2
                                            flex items-center justify-between
                                            text-left
                                            hover:bg-parchment/10
                                            rounded-lg
                                            transition-colors
                                            group
                                        "
                                    >
                                        <span className="font-serif text-parchment group-hover:text-gold transition-colors">
                                            {suggestion.word}
                                        </span>
                                        <span className="text-xs text-parchment/40 font-mono">
                                            {suggestion.category}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Recent searches */}
                        {!query && recentSearches.length > 0 && (
                            <div className="p-2">
                                <div className="px-3 py-2 text-xs font-mono text-gold/60 uppercase tracking-wider flex items-center gap-2">
                                    <History className="w-3 h-3" />
                                    Recent
                                </div>
                                {recentSearches.map((word) => (
                                    <button
                                        key={word}
                                        onClick={() => handleSearch(word)}
                                        className="
                                            w-full px-4 py-2
                                            text-left font-serif text-parchment
                                            hover:bg-parchment/10 hover:text-gold
                                            rounded-lg
                                            transition-colors
                                        "
                                    >
                                        {word}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Trending words */}
                        {!query && (
                            <div className="p-2 border-t border-gold/20">
                                <div className="px-3 py-2 text-xs font-mono text-gold/60 uppercase tracking-wider flex items-center gap-2">
                                    <TrendingUp className="w-3 h-3" />
                                    Popular
                                </div>
                                {SUGGESTIONS.slice(0, 3).map((suggestion) => (
                                    <button
                                        key={suggestion.word}
                                        onClick={() => handleSearch(suggestion.word)}
                                        className="
                                            w-full px-4 py-2
                                            text-left font-serif text-parchment
                                            hover:bg-parchment/10 hover:text-gold
                                            rounded-lg
                                            transition-colors
                                        "
                                    >
                                        {suggestion.word}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
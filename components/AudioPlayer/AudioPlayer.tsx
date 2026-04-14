'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Volume2,
    VolumeX,
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Music,
    ChevronUp
} from 'lucide-react'

// Playlist tracks
const PLAYLIST = [
    {
        id: 'etymon-theme',
        title: 'Gregorian Chant',
        artist: 'Etymon',
        src: '/audio/playlist/poshpony-gregorian-chant-324547.mp3',
        fallback: '/audio/playlist/poshpony-gregorian-chant-324547.mp3',
        mobileSrc: '/audio/playlist/poshpony-gregorian-chant-324547.mp3',
        duration: 180 // seconds
    }
]

interface AudioPlayerProps {
    autoPlay?: boolean
    defaultVolume?: number
}

export function AudioPlayer({ autoPlay = false, defaultVolume = 0.3 }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [volume, setVolume] = useState(defaultVolume)
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
    const [isExpanded, setIsExpanded] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isMobile, setIsMobile] = useState(false)
    const [audioError, setAudioError] = useState(false)

    const audioRef = useRef<HTMLAudioElement>(null)
    const currentTrack = PLAYLIST[currentTrackIndex]

    // Detect mobile device
    useEffect(() => {
        setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }, [])

    // Initialize audio
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume

            // Auto-play if enabled (browsers may block this)
            if (autoPlay) {
                const playPromise = audioRef.current.play()
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => setIsPlaying(true))
                        .catch((error) => {
                            // Auto-play blocked, wait for user interaction
                            console.log('Auto-play blocked, waiting for user interaction')
                        })
                }
            }
        }
    }, [autoPlay, volume])

    // Handle track ended
    const handleTrackEnded = useCallback(() => {
        // Play next track
        setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length)
    }, [])

    // Change track when index changes
    useEffect(() => {
        if (audioRef.current && isPlaying) {
            audioRef.current.play().catch(console.error)
        }
        setAudioError(false)
    }, [currentTrackIndex, isPlaying])

    // Time update handler
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime)
        }
    }

    // Load metadata
    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration)
        }
    }

    // Toggle play/pause
    const togglePlay = useCallback(() => {
        if (!audioRef.current) return

        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(console.error)
        }
    }, [isPlaying])

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (!audioRef.current) return

        audioRef.current.muted = !isMuted
        setIsMuted(!isMuted)
    }, [isMuted])

    // Handle volume change
    const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value)
        setVolume(newVolume)
        if (audioRef.current) {
            audioRef.current.volume = newVolume
            if (newVolume > 0 && isMuted) {
                audioRef.current.muted = false
                setIsMuted(false)
            }
        }
    }, [isMuted])

    // Handle seek
    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value)
        setCurrentTime(newTime)
        if (audioRef.current) {
            audioRef.current.currentTime = newTime
        }
    }, [])

    // Next track
    const nextTrack = useCallback(() => {
        setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length)
    }, [])

    // Previous track
    const previousTrack = useCallback(() => {
        setCurrentTrackIndex((prev) =>
            prev === 0 ? PLAYLIST.length - 1 : prev - 1
        )
    }, [])

    // Format time
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Handle audio error
    const handleAudioError = () => {
        setAudioError(true)
        console.error('Audio failed to load')
    }

    return (
        <>
            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                src={isMobile ? (currentTrack.mobileSrc || currentTrack.src) : currentTrack.src}
                onEnded={handleTrackEnded}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata} // duration
                onError={handleAudioError}
                loop={PLAYLIST.length == 1} // Loop only if there is one song; or else cycle through playlist
                preload="metadata"
            >
                {/* Fallback sources */}
                <source src={currentTrack.src} type="audio/mp3" />
                <source src={currentTrack.fallback} type="audio/mp3" />
            </audio>

            {/* Audio Player UI */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-4 left-4 z-20"
            >
                <div className="relative">
                    {/* Collapsed player */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`
                            flex items-center gap-3
                            px-4 py-3
                            bg-parchment/5 backdrop-blur-xl
                            border border-gold/30
                            rounded-full
                            shadow-lg
                            transition-all duration-300
                            ${isPlaying ? 'border-gold shadow-gold/20' : ''}
                        `}
                    >
                        {/* Music icon with animation */}
                        <motion.div
                            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                            transition={isPlaying ? {
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear"
                            } : {}}
                        >
                            <Music className={`
                                w-5 h-5
                                ${isPlaying ? 'text-gold' : 'text-parchment/60'}
                            `} />
                        </motion.div>

                        {/* Track info */}
                        <div className="text-left">
                            <div className="text-xs text-gold font-serif truncate max-w-[150px]">
                                {currentTrack.title}
                            </div>
                            <div className="text-[10px] text-parchment/50 font-mono">
                                {isPlaying ? 'Now Playing' : 'Paused'}
                            </div>
                        </div>

                        {/* Play/Pause button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                togglePlay()
                            }}
                            className="p-1 hover:bg-parchment/10 rounded-full transition-colors"
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4 text-gold" />
                            ) : (
                                <Play className="w-4 h-4 text-gold" />
                            )}
                        </button>

                        {/* Volume indicator */}
                        <div className="flex items-center gap-1">
                            {isMuted || volume === 0 ? (
                                <VolumeX className="w-4 h-4 text-parchment/40" />
                            ) : (
                                <Volume2 className="w-4 h-4 text-parchment/60" />
                            )}
                        </div>

                        {/* Expand chevron */}
                        <ChevronUp className={`
                            w-4 h-4 text-parchment/40
                            transition-transform duration-300
                            ${isExpanded ? 'rotate-180' : ''}
                        `} />
                    </motion.div>

                    {/* Expanded player panel */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: 10, height: 0 }}
                                className="
                                    absolute bottom-full left-0 mb-2
                                    w-80
                                    bg-ink/95 backdrop-blur-xl
                                    border border-gold/30
                                    rounded-2xl
                                    shadow-2xl
                                    overflow-hidden
                                "
                            >
                                <div className="p-4 space-y-4">
                                    {/* Now playing */}
                                    <div className="text-center">
                                        <h4 className="font-serif text-lg text-gold">
                                            {currentTrack.title}
                                        </h4>
                                        <p className="text-xs text-parchment/50 font-mono">
                                            {currentTrack.artist}
                                        </p>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="space-y-1">
                                        <input
                                            type="range"
                                            min={0}
                                            max={duration || 100}
                                            value={currentTime}
                                            onChange={handleSeek}
                                            className="
                                                w-full h-1
                                                bg-parchment/20
                                                rounded-full
                                                appearance-none
                                                cursor-pointer
                                                [&::-webkit-slider-thumb]:appearance-none
                                                [&::-webkit-slider-thumb]:w-3
                                                [&::-webkit-slider-thumb]:h-3
                                                [&::-webkit-slider-thumb]:rounded-full
                                                [&::-webkit-slider-thumb]:bg-gold
                                                [&::-webkit-slider-thumb]:cursor-pointer
                                                [&::-webkit-slider-thumb]:shadow-lg
                                            "
                                            style={{
                                                background: `linear-gradient(to right, #C9A94E 0%, #C9A94E ${(currentTime / (duration || 1)) * 100}%, rgba(245, 230, 211, 0.2) ${(currentTime / (duration || 1)) * 100}%, rgba(245, 230, 211, 0.2) 100%)`
                                            }}
                                        />
                                        <div className="flex justify-between text-[10px] text-parchment/50 font-mono">
                                            <span>{formatTime(currentTime)}</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                    </div>

                                    {/* Playback controls */}
                                    <div className="flex items-center justify-center gap-4">
                                        <button
                                            onClick={previousTrack}
                                            className="p-2 hover:bg-parchment/10 rounded-full transition-colors"
                                        >
                                            <SkipBack className="w-5 h-5 text-parchment/60" />
                                        </button>

                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={togglePlay}
                                            className="
                                                p-3
                                                bg-gradient-to-r from-gold/20 to-gold/10
                                                border border-gold
                                                rounded-full
                                                shadow-lg shadow-gold/20
                                            "
                                        >
                                            {isPlaying ? (
                                                <Pause className="w-6 h-6 text-gold" />
                                            ) : (
                                                <Play className="w-6 h-6 text-gold" />
                                            )}
                                        </motion.button>

                                        <button
                                            onClick={nextTrack}
                                            className="p-2 hover:bg-parchment/10 rounded-full transition-colors"
                                        >
                                            <SkipForward className="w-5 h-5 text-parchment/60" />
                                        </button>
                                    </div>

                                    {/* Volume control */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={toggleMute}
                                            className="p-1 hover:bg-parchment/10 rounded-full transition-colors"
                                        >
                                            {isMuted || volume === 0 ? (
                                                <VolumeX className="w-4 h-4 text-parchment/40" />
                                            ) : (
                                                <Volume2 className="w-4 h-4 text-parchment/60" />
                                            )}
                                        </button>

                                        <input
                                            type="range"
                                            min={0}
                                            max={1}
                                            step={0.01}
                                            value={isMuted ? 0 : volume}
                                            onChange={handleVolumeChange}
                                            className="
                                                flex-1 h-1
                                                bg-parchment/20
                                                rounded-full
                                                appearance-none
                                                cursor-pointer
                                                [&::-webkit-slider-thumb]:appearance-none
                                                [&::-webkit-slider-thumb]:w-3
                                                [&::-webkit-slider-thumb]:h-3
                                                [&::-webkit-slider-thumb]:rounded-full
                                                [&::-webkit-slider-thumb]:bg-gold
                                                [&::-webkit-slider-thumb]:cursor-pointer
                                            "
                                            style={{
                                                background: `linear-gradient(to right, #C9A94E 0%, #C9A94E ${volume * 100}%, rgba(245, 230, 211, 0.2) ${volume * 100}%, rgba(245, 230, 211, 0.2) 100%)`
                                            }}
                                        />

                                        <span className="text-[10px] text-parchment/50 font-mono w-8">
                                            {Math.round(volume * 100)}%
                                        </span>
                                    </div>

                                    {/* Playlist */}
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-gold/60 font-mono uppercase tracking-wider mb-2">
                                            Playlist
                                        </div>
                                        {PLAYLIST.map((track, index) => (
                                            <button
                                                key={track.id}
                                                onClick={() => setCurrentTrackIndex(index)}
                                                className={`
                                                    w-full px-3 py-2
                                                    text-left
                                                    rounded-lg
                                                    transition-colors
                                                    ${index === currentTrackIndex
                                                        ? 'bg-gold/20 border border-gold/50'
                                                        : 'hover:bg-parchment/5'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className={`
                                                            text-sm font-serif
                                                            ${index === currentTrackIndex
                                                                ? 'text-gold'
                                                                : 'text-parchment/80'
                                                            }
                                                        `}>
                                                            {track.title}
                                                        </div>
                                                        <div className="text-[10px] text-parchment/50 font-mono">
                                                            {track.artist}
                                                        </div>
                                                    </div>
                                                    {index === currentTrackIndex && isPlaying && (
                                                        <motion.div
                                                            animate={{ scale: [1, 1.2, 1] }}
                                                            transition={{
                                                                duration: 1,
                                                                repeat: Infinity
                                                            }}
                                                            className="w-1.5 h-1.5 bg-gold rounded-full"
                                                        />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Audio settings note */}
                                    <div className="text-center">
                                        <p className="text-[8px] text-parchment/30 font-mono uppercase tracking-wider">
                                            Audio enhances the classic experience
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Audio error fallback */}
            <AnimatePresence>
                {audioError && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed bottom-24 left-4 z-20"
                    >
                        <div className="px-4 py-2 bg-red-500/20 backdrop-blur-xl border border-red-500/50 rounded-lg">
                            <p className="text-xs text-red-400">
                                Audio failed to load. Please check your connection.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
'use client'

import { useEffect, useRef } from 'react'

interface Star {
    x: number
    y: number
    size: number
    brightness: number
    speed: number
    twinkleSpeed: number
    twinklePhase: number
    color: string
}

export function StarfieldBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const starsRef = useRef<Star[]>([])
    const animationFrameRef = useRef<number | undefined>(undefined)
    const timeRef = useRef(0)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Initialize stars
        const initStars = () => {
            const stars: Star[] = []
            const starCount = Math.floor((window.innerWidth * window.innerHeight) / 5000) // Responsive density

            const colors = [
                'rgba(255, 255, 255, ',  // Pure white
                'rgba(201, 169, 78, ',   // Gold
                'rgba(255, 245, 200, ',  // Warm white
                'rgba(180, 200, 255, ',  // Slight blue
            ]

            for (let i = 0; i < starCount; i++) {
                const colorBase = colors[Math.floor(Math.random() * colors.length)]
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2.5 + 0.5,
                    brightness: Math.random() * 0.5 + 0.3,
                    speed: Math.random() * 0.5 + 0.25, // Slow upward drift
                    twinkleSpeed: Math.random() * 0.02 + 0.01,
                    twinklePhase: Math.random() * Math.PI * 2,
                    color: colorBase
                })
            }

            starsRef.current = stars
        }

        // Resize handler
        const handleResize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            initStars()
        }

        handleResize()
        window.addEventListener('resize', handleResize)

        // Animation loop
        const animate = (timestamp: number) => {
            if (!ctx || !canvas) return

            timeRef.current += 0.01

            // Clear canvas with deep ink background
            ctx.fillStyle = '#0A0E17'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Draw stars
            starsRef.current.forEach(star => {
                // Update position - gentle upward drift
                star.y -= star.speed

                // Wrap around when reaching top
                if (star.y < -10) {
                    star.y = canvas.height + 10
                    star.x = Math.random() * canvas.width
                }

                // Calculate twinkling brightness
                const twinkle = Math.sin(timeRef.current * star.twinkleSpeed * 100 + star.twinklePhase)
                const brightnessVariation = 0.3 // 30% variation
                const currentBrightness = star.brightness * (1 + twinkle * brightnessVariation)

                // Draw star with glow
                const gradient = ctx.createRadialGradient(
                    star.x, star.y, 0,
                    star.x, star.y, star.size * 4
                )

                const alpha = Math.min(currentBrightness, 0.9)
                gradient.addColorStop(0, star.color + alpha + ')')
                gradient.addColorStop(0.5, star.color + (alpha * 0.3) + ')')
                gradient.addColorStop(1, star.color + '0)')

                ctx.beginPath()
                ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2)
                ctx.fillStyle = gradient
                ctx.fill()

                // Draw bright core
                ctx.beginPath()
                ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2)
                ctx.fillStyle = star.color + Math.min(currentBrightness + 0.2, 1) + ')'
                ctx.fill()
            })

            // Draw occasional "shooting star" effect (rare)
            if (Math.random() < 0.005) {
                const shootingStar = {
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height * 0.3,
                    length: Math.random() * 80 + 40,
                    angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3
                }

                const gradient = ctx.createLinearGradient(
                    shootingStar.x, shootingStar.y,
                    shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length,
                    shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length
                )
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
                gradient.addColorStop(0.5, 'rgba(201, 169, 78, 0.3)')
                gradient.addColorStop(1, 'rgba(201, 169, 78, 0)')

                ctx.beginPath()
                ctx.moveTo(shootingStar.x, shootingStar.y)
                ctx.lineTo(
                    shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length,
                    shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length
                )
                ctx.strokeStyle = gradient
                ctx.lineWidth = 2
                ctx.stroke()
            }

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animationFrameRef.current = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('resize', handleResize)
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
        />
    )
}
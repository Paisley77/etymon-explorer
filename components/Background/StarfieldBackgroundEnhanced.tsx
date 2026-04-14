'use client'

import { useEffect, useRef } from 'react'

interface Star {
    x: number
    y: number
    z: number // Depth for parallax
    size: number
    brightness: number
    speed: number
    twinkleSpeed: number
    twinklePhase: number
    color: string
}

export function StarfieldBackgroundEnhanced() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const starsRef = useRef<Star[]>([])
    const animationFrameRef = useRef<number | undefined>(undefined)
    const timeRef = useRef(0)
    const mouseRef = useRef({ x: 0.5, y: 0.5 })

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Initialize stars with parallax layers
        const initStars = () => {
            const stars: Star[] = []
            const starCount = Math.floor((window.innerWidth * window.innerHeight) / 4000)

            const colors = [
                'rgba(255, 255, 255, ',
                'rgba(201, 169, 78, ',
                'rgba(255, 245, 200, ',
                'rgba(180, 200, 255, ',
                'rgba(220, 180, 140, ',
            ]

            for (let i = 0; i < starCount; i++) {
                const colorBase = colors[Math.floor(Math.random() * colors.length)]
                const depth = Math.random() // 0 = far, 1 = close

                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    z: depth,
                    size: (depth * 2 + 0.5) * (Math.random() * 1.5 + 0.5),
                    brightness: (depth * 0.3 + 0.4) * (Math.random() * 0.5 + 0.5),
                    speed: (1 - depth) * 0.5 + 0.15, // Far stars move slower (parallax)
                    twinkleSpeed: Math.random() * 0.02 + 0.005,
                    twinklePhase: Math.random() * Math.PI * 2,
                    color: colorBase
                })
            }

            starsRef.current = stars
        }

        // Mouse move handler for subtle parallax
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = {
                x: e.clientX / window.innerWidth,
                y: e.clientY / window.innerHeight
            }
        }

        const handleResize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            initStars()
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        window.addEventListener('mousemove', handleMouseMove)

        // Draw nebula background
        const drawNebula = () => {
            if (!ctx || !canvas) return

            // Create subtle color washes
            const gradient1 = ctx.createRadialGradient(
                canvas.width * 0.2, canvas.height * 0.3, 0,
                canvas.width * 0.2, canvas.height * 0.3, canvas.width * 0.5
            )
            gradient1.addColorStop(0, 'rgba(30, 20, 60, 0.15)')
            gradient1.addColorStop(1, 'rgba(10, 14, 23, 0)')

            const gradient2 = ctx.createRadialGradient(
                canvas.width * 0.8, canvas.height * 0.7, 0,
                canvas.width * 0.8, canvas.height * 0.7, canvas.width * 0.4
            )
            gradient2.addColorStop(0, 'rgba(60, 40, 20, 0.1)')
            gradient2.addColorStop(1, 'rgba(10, 14, 23, 0)')

            ctx.fillStyle = gradient1
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = gradient2
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        const animate = (timestamp: number) => {
            if (!ctx || !canvas) return

            timeRef.current += 0.01

            // Clear canvas
            ctx.fillStyle = '#0A0E17'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Draw nebula effects
            drawNebula()

            // Calculate parallax offset based on mouse
            const parallaxX = (mouseRef.current.x - 0.5) * 30
            const parallaxY = (mouseRef.current.y - 0.5) * 30

            // Draw stars
            starsRef.current.forEach(star => {
                // Update position with parallax
                star.y -= star.speed

                // Add subtle horizontal drift for far stars
                if (star.z < 0.3) {
                    star.x += Math.sin(timeRef.current * 0.1 + star.y * 0.01) * 0.02
                }

                // Wrap around
                if (star.y < -10) {
                    star.y = canvas.height + 10
                    star.x = Math.random() * canvas.width
                }
                if (star.x < -10) star.x = canvas.width + 10
                if (star.x > canvas.width + 10) star.x = -10

                // Calculate display position with parallax
                const displayX = star.x + parallaxX * (1 - star.z) * 0.5
                const displayY = star.y + parallaxY * (1 - star.z) * 0.3

                // Twinkling
                const twinkle = Math.sin(timeRef.current * star.twinkleSpeed * 100 + star.twinklePhase)
                const brightnessVariation = 0.4
                const currentBrightness = star.brightness * (1 + twinkle * brightnessVariation)

                // Draw glow
                const gradient = ctx.createRadialGradient(
                    displayX, displayY, 0,
                    displayX, displayY, star.size * 5
                )

                const alpha = Math.min(currentBrightness, 0.95)
                gradient.addColorStop(0, star.color + alpha + ')')
                gradient.addColorStop(0.4, star.color + (alpha * 0.4) + ')')
                gradient.addColorStop(1, star.color + '0)')

                ctx.beginPath()
                ctx.arc(displayX, displayY, star.size * 2.5, 0, Math.PI * 2)
                ctx.fillStyle = gradient
                ctx.fill()

                // Draw core
                ctx.beginPath()
                ctx.arc(displayX, displayY, star.size * 0.6, 0, Math.PI * 2)
                ctx.fillStyle = star.color + Math.min(currentBrightness + 0.3, 1) + ')'
                ctx.fill()

                // Draw cross flare for bright stars
                if (star.brightness > 0.7 && star.size > 2) {
                    ctx.save()
                    ctx.translate(displayX, displayY)
                    const flareAlpha = currentBrightness * 0.3
                    ctx.strokeStyle = star.color + flareAlpha + ')'
                    ctx.lineWidth = star.size * 0.3

                    ctx.beginPath()
                    ctx.moveTo(-star.size * 4, 0)
                    ctx.lineTo(star.size * 4, 0)
                    ctx.stroke()

                    ctx.beginPath()
                    ctx.moveTo(0, -star.size * 4)
                    ctx.lineTo(0, star.size * 4)
                    ctx.stroke()
                    ctx.restore()
                }
            })

            // Occasional shooting star
            if (Math.random() < 0.003) {
                const shootingStar = {
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height * 0.2,
                    length: Math.random() * 100 + 60,
                    angle: Math.PI / 3 + (Math.random() - 0.5) * 0.4,
                    speed: Math.random() * 15 + 10
                }

                let progress = 0
                const animateShootingStar = () => {
                    if (progress < 1) {
                        progress += 0.05

                        const currentX = shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length * progress
                        const currentY = shootingStar.y + Math.sin(shootingStar.angle) * shootingStar.length * progress

                        const gradient = ctx.createLinearGradient(
                            currentX, currentY,
                            currentX + Math.cos(shootingStar.angle) * shootingStar.length * (1 - progress) * 0.5,
                            currentY - Math.sin(shootingStar.angle) * shootingStar.length * (1 - progress) * 0.5
                        )
                        gradient.addColorStop(0, `rgba(255, 255, 255, ${1 - progress})`)
                        gradient.addColorStop(1, 'rgba(201, 169, 78, 0)')

                        ctx.beginPath()
                        ctx.moveTo(currentX, currentY)
                        ctx.lineTo(
                            currentX + Math.cos(shootingStar.angle) * shootingStar.length * (1 - progress),
                            currentY - Math.sin(shootingStar.angle) * shootingStar.length * (1 - progress)
                        )
                        ctx.strokeStyle = gradient
                        ctx.lineWidth = 2 * (1 - progress)
                        ctx.stroke()

                        requestAnimationFrame(animateShootingStar)
                    }
                }

                animateShootingStar()
            }

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animationFrameRef.current = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('mousemove', handleMouseMove)
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
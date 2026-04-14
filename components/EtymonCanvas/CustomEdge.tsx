'use client'

import { memo, useMemo } from 'react'
import {
    BaseEdge,
    EdgeProps,
    getBezierPath,
    EdgeLabelRenderer
} from '@xyflow/react'
import { motion } from 'framer-motion'
import { useEtymonStore } from '@/lib/store/etymonStore'

interface CustomEdgeData {
    relationshipType: string
    confidence: number
    yearOfTransition?: number
}

const relationshipColors: Record<string, { stroke: string; dash: string }> = {
    derivedFrom: { stroke: '#C9A94E', dash: 'none' },
    borrowed: { stroke: '#D4AF37', dash: '8,4' },
    cognate: { stroke: '#E8D5A5', dash: '4,4' },
    calque: { stroke: '#B8960C', dash: '2,4' }
}

const relationshipLabels: Record<string, string> = {
    derivedFrom: 'derived from',
    borrowed: 'borrowed from',
    cognate: 'related to',
    calque: 'calque of'
}

export const CustomEdge = memo(({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected
}: EdgeProps) => {
    const edgeData = data as unknown as CustomEdgeData
    const { highlightedPathIds } = useEtymonStore()
    const isHighlighted = highlightedPathIds?.edges.includes(id)

    // Calculate bezier path
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.3
    })

    const colors = edgeData?.relationshipType
        ? relationshipColors[edgeData.relationshipType]
        : relationshipColors.derivedFrom

    const label = edgeData?.relationshipType
        ? relationshipLabels[edgeData.relationshipType]
        : 'connected to'

    // Generate a unique gradient ID for this edge
    const gradientId = useMemo(() => `edge-gradient-${id}`, [id])

    return (
        <>
            {/* SVG Definitions */}
            <defs>
                <linearGradient
                    id={gradientId}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                >
                    <stop
                        offset="0%"
                        stopColor={colors.stroke}
                        stopOpacity={0.3}
                    />
                    <stop
                        offset="50%"
                        stopColor={colors.stroke}
                        stopOpacity={0.8}
                    />
                    <stop
                        offset="100%"
                        stopColor={colors.stroke}
                        stopOpacity={0.3}
                    />
                </linearGradient>

                {/* Glow filter */}
                <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation={selected ? 4 : 2} result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Glow layer */}
            <BaseEdge
                path={edgePath}
                style={{
                    stroke: colors.stroke,
                    strokeWidth: selected ? 8 : 4,
                    opacity: 0.15,
                    filter: `url(#glow-${id})`
                }}
            />

            {/* Main edge */}
            <path
                d={edgePath}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={selected ? 3 : 2}
                strokeDasharray={colors.dash}
                // initial={{ pathLength: 0, opacity: 0 }}
                // animate={{ pathLength: 1, opacity: 1 }}
                // transition={{
                //     duration: 0.8,
                //     ease: "easeInOut"
                // }}
                className="transition-all duration-300"
            />

            {/* Animated particles along the edge */}
            {edgeData?.relationshipType === 'derivedFrom' && (
                <motion.circle
                    r={3}
                    fill={colors.stroke}
                    key={`particle-${id}-${sourceX}-${sourceY}-${targetX}-${targetY}`}
                    initial={{ offsetDistance: '0%' }}
                    animate={{ offsetDistance: '100%' }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{
                        offsetPath: `path("${edgePath}")`,
                        filter: `url(#glow-${id})`
                    }}
                />
            )}

            {/* Edge Label */}
            <EdgeLabelRenderer>
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        position: 'absolute',
                        left: `${labelX}px`,
                        top: `${labelY}px`,
                        transform: `translate(-50%, -50%)`,
                        pointerEvents: 'all'
                    }}
                    className="group"
                >
                    <div className="relative">
                        {/* Label background */}
                        <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm rounded-full -z-10" />

                        {/* Label content */}
                        <div className="px-3 py-1 text-xs font-serif text-parchment/80 whitespace-nowrap">
                            <span className="text-gold mr-1">{label}</span>
                            {edgeData?.confidence && (
                                <span className="text-gold/40 text-[10px]">
                                    {(edgeData.confidence * 100).toFixed(0)}%
                                </span>
                            )}
                        </div>

                        {/* Year badge if available */}
                        {edgeData?.yearOfTransition && (
                            <div className="absolute -bottom-4 left-1/3 -translate-x-1/2">
                                <span className="text-[10px] font-mono text-gold whitespace-nowrap">
                                    c. {Math.abs(edgeData.yearOfTransition)} {edgeData.yearOfTransition < 0 ? ' BCE' : ' CE'}
                                </span>
                            </div>
                        )}

                        {/* Hover tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-parchment/10 backdrop-blur-md border border-gold/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            <div className="text-xs">
                                <div className="text-gold font-semibold mb-1">
                                    {edgeData?.relationshipType}
                                </div>
                                <div className="text-parchment/60">
                                    Confidence: {((edgeData?.confidence || 0) * 100).toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </EdgeLabelRenderer>

            {/* Selected edge highlight */}
            {(selected || isHighlighted) && (
                <motion.path
                    d={edgePath}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth={1}
                    strokeDasharray="4,4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                    opacity={0.5}
                />
            )}
        </>
    )
})

CustomEdge.displayName = 'CustomEdge'
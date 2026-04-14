'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Connection,
    Edge,
    Node,
    useReactFlow,
    ReactFlowProvider
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { useEtymonStore } from '@/lib/store/etymonStore'
import { CustomNode } from './CustomNode'
import { CustomEdge } from './CustomEdge'
import { TimeSlider } from './TimeSlider'
import { SearchBar } from './SearchBar'
import { NodeDetailsPanel } from './NodeDetailsPanel'
import { Move, X } from 'lucide-react'

const nodeTypes = {
    etymologyNode: CustomNode,
}

const edgeTypes = {
    etymologyEdge: CustomEdge,
}

export function EtymonCanvas() {
    const { fitView } = useReactFlow()
    const {
        nodes: storeNodes,
        edges: storeEdges,
        selectedNodeId,
        selectNode,
        setHighlightedPathIds,
        viewport,
        setViewport,
        exploreWord,
        isLoading
    } = useEtymonStore()

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

    // Sync store nodes to React Flow nodes
    useEffect(() => {
        const flowNodes = Array.from(storeNodes.values()).map(node => ({
            id: node.id,
            type: 'etymologyNode',
            position: node.position,
            data: {
                word: node.word,
                language: node.language,
                era: node.era,
                definition: node.definition,
                metadata: node.metadata,
                isSelected: node.id === selectedNodeId
            }
        }))

        setNodes(flowNodes)
    }, [storeNodes, selectedNodeId, setNodes])

    // Sync store edges to React Flow edges
    useEffect(() => {
        const flowEdges = Array.from(storeEdges.values()).map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: 'etymologyEdge',
            data: {
                relationshipType: edge.relationshipType,
                confidence: edge.confidence,
                yearOfTransition: edge.yearOfTransition
            },
            animated: edge.relationshipType === 'derivedFrom'
        }))

        setEdges(flowEdges)
    }, [storeEdges, setEdges])

    const onConnect = useCallback((connection: Connection) => {
        // Handle manual connections if needed
        console.log('Connection attempt:', connection)
    }, [])

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        selectNode(node.id)
    }, [selectNode])

    const onPaneClick = useCallback(() => {
        selectNode(null)
        setHighlightedPathIds(null)
    }, [selectNode, setHighlightedPathIds])

    const onMove = useCallback((event: any, viewport: any) => {
        setViewport(viewport)
    }, [setViewport])

    const handleSearch = useCallback(async (word: string) => {
        await exploreWord(word)
        setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100)
    }, [exploreWord, fitView])

    return (
        <div className="relative w-full h-screen" >
            {/* Background gradient */}
            {/* <div className="absolute inset-0 bg-gradient-radial from-ink-light to-ink pointer-events-none" /> */}

            {/* Main Canvas */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onMove={onMove}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultViewport={viewport}
                fitView
                attributionPosition="bottom-left"
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    color="#C9A94E"
                    gap={32}
                    size={2}
                    className="opacity-20"
                />
                <Controls
                    className="!bg-parchment/10 !border-gold/20 !backdrop-blur-sm"
                    style={{
                        border: '1px solid rgba(201, 169, 78, 0.2)',
                        borderRadius: '8px'
                    }}
                />
                <MiniMap
                    className="!bg-parchment/10 !border-gold/20 !backdrop-blur-sm"
                    maskColor="rgba(15, 23, 42, 0.6)"
                    nodeColor={(node) => {
                        const era = node.data?.era
                        switch (era) {
                            case 'ancient': return '#8B6914'
                            case 'medieval': return '#a98c3c'
                            case 'earlyModern': return '#D4AF37'
                            default: return '#E8D5A5'
                        }
                    }}
                />

                <GroupDragHandle />
            </ReactFlow>

            {/* UI Overlays */}
            <div className="absolute top-4 left-4 z-10">
                <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>

            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 w-2/3 max-w-3xl">
                <TimeSlider />
            </div>

            <AnimatePresence>
                {selectedNodeId && (
                    <NodeDetailsPanel
                        nodeId={selectedNodeId}
                        onClose={() => selectNode(null)}
                    />
                )}
            </AnimatePresence>

            {/* Loading overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-ink/50 backdrop-blur-sm z-20 flex items-center justify-center"
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-parchment text-lg font-serif">
                                Querying AI for etymological family...
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/**
 * GroupDragHandle - A floating handle that appears when multiple nodes are selected,
 * allowing the user to drag the entire connected component together.
 */
export function GroupDragHandle() {
    const {
        selectedNodeIds,
        nodes,
        isGroupDragging,
        viewport,
        startGroupDrag,
        updateGroupDrag,
        endGroupDrag,
        clearSelection
    } = useEtymonStore()

    const [position, setPosition] = useState({ x: 0, y: 0 })
    const handleRef = useRef<HTMLDivElement>(null)

    // Calculate the position of the drag handle (centered above the selected group)
    useEffect(() => {
        if (selectedNodeIds.size === 0) return
        // Calculate bounding box of selected nodes
        let minX = Infinity, minY = Infinity
        let maxX = -Infinity, maxY = -Infinity

        selectedNodeIds.forEach((id) => {
            const node = nodes.get(id)
            if (node) {
                minX = Math.min(minX, node.position.x)
                minY = Math.min(minY, node.position.y)
                maxX = Math.max(maxX, node.position.x + 150) // Approximate node width
                maxY = Math.max(maxY, node.position.y + 80)  // Approximate node height
            }
        })

        if (minX !== Infinity) {
            // Position handle above the group, centered horizontally
            const canvasX = (minX + maxX) / 2
            const canvasY = minY - 150 // Position above the topmost node

            // TRANSFORM CANVAS COORDINATES TO SCREEN COORDINATES
            // React Flow transform formula: screen = canvas * zoom + pan
            const screenX = canvasX * viewport.zoom + viewport.x
            const screenY = canvasY * viewport.zoom + viewport.y

            setPosition({
                x: screenX,
                y: screenY
            })
        }
    }, [selectedNodeIds, nodes, viewport])

    // Global mouse move handler for dragging
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isGroupDragging) {
                updateGroupDrag(e.clientX, e.clientY)
            }
        }

        const handleMouseUp = () => {
            if (isGroupDragging) {
                endGroupDrag()
            }
        }

        if (isGroupDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isGroupDragging, updateGroupDrag, endGroupDrag])

    // Don't show handle if less than 2 nodes selected
    if (selectedNodeIds.size < 2) return null

    return (
        <AnimatePresence>
            <motion.div
                ref={handleRef}
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                className="absolute z-30 pointer-events-auto"
                style={{
                    left: position.x,
                    top: position.y,
                    transform: 'translate(-50%, -50%)'
                }}
            >
                {/* Selection info badge */}
                <div className="flex items-center gap-2 px-4 py-2 bg-ink-light border border-gold rounded-full shadow-xl">
                    <span className="text-xs text-parchment/60">
                        {selectedNodeIds.size} nodes selected
                    </span>

                    {/* Drag handle button */}
                    <button
                        onMouseDown={(e) => {
                            e.stopPropagation()
                            startGroupDrag(e.clientX, e.clientY)
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-gold/20 border border-gold/50 rounded-full text-gold hover:bg-gold/30 transition-colors cursor-grab active:cursor-grabbing"
                    >
                        <Move className="w-4 h-4" />
                        <span className="text-sm font-serif">Drag Group</span>
                    </button>

                    {/* Clear selection button */}
                    <button
                        onClick={clearSelection}
                        className="p-1 text-parchment/40 hover:text-parchment transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Arrow pointing down to the group */}
                <div className="absolute left-1/2 -bottom-3 -translate-x-1/2 w-3 h-3 bg-ink-light border-r border-b border-gold rotate-45" />
            </motion.div>
        </AnimatePresence>
    )
}

// Wrap with provider
export function EtymonCanvasWithProvider() {
    return (
        <ReactFlowProvider>
            <EtymonCanvas />
        </ReactFlowProvider>
    )
}
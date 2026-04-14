import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
    WordNode,
    Position,
    EtymologyEdge,
    Viewport,
    EtymologyPath,
} from '@/types/etymon.types'
import { EtymologyGraph } from '@/lib/algorithms/etymonDijkstra'

interface EtymonStore {
    // State
    nodes: Map<string, WordNode>
    edges: Map<string, EtymologyEdge>
    selectedNodeId: string | null
    viewport: Viewport
    timeSliderValue: number
    isLoading: boolean
    error: string | null
    graph: EtymologyGraph | null
    highlightedPathIds: { nodes: string[], edges: string[] } | null
    selectedNodeIds: Set<string>
    isGroupDragging: boolean
    groupDragOffset: { x: number; y: number } | null

    // Actions
    setViewport: (viewport: Viewport) => void
    setTimeSlider: (value: number) => void
    setHighlightedPathIds: (path: { nodes: string[], edges: string[] } | null) => void
    selectNode: (nodeId: string | null) => void
    exploreWord: (word: string, language?: string) => Promise<void>
    findPath: (startWordId: string, endWordId: string) => Promise<EtymologyPath | null>

    // For group dragging
    selectConnectedComponent: (nodeId: string) => void  // Select entire tree
    clearSelection: () => void
    startGroupDrag: (mouseX: number, mouseY: number) => void
    updateGroupDrag: (mouseX: number, mouseY: number) => void
    endGroupDrag: () => void
    moveSelectedNodes: (deltaX: number, deltaY: number) => void

    addNode: (node: WordNode) => void
    addEdge: (edge: EtymologyEdge) => void
    clearError: () => void
    rebuildGraph: () => void
}

export const useEtymonStore = create<EtymonStore>()(
    devtools(
        (set, get) => ({
            // Initial state
            nodes: new Map(),
            edges: new Map(),
            selectedNodeId: null,
            selectedNodeIds: new Set<string>(),
            isGroupDragging: false,
            groupDragOffset: null,
            viewport: { x: 0, y: 0, zoom: 1 },
            timeSliderValue: 1.0, // current 
            isLoading: false,
            error: null,
            graph: null,

            // Actions
            setViewport: (viewport) => set({ viewport }),

            setTimeSlider: (value) => {
                set({ timeSliderValue: value })
                // This will trigger UI updates for word morphing
            },

            setHighlightedPathIds: (path) => {
                set({ highlightedPathIds: path })
            },

            selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

            exploreWord: async (word, language = 'Modern English') => {
                set({ isLoading: true, error: null })

                try {
                    // Client cannot direcly access database service
                    // Needs to make a request using API route 
                    // Route checks database first
                    // If does not exist in database, then make an AI request,
                    // Updates database with the new word & relations
                    const response = await fetch('/api/etymology/explore', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ word, language }),
                    })

                    if (!response.ok) {
                        throw new Error('Failed to fetch word data')
                    }

                    const result = await response.json()

                    if (!result.success) {
                        throw new Error(result.error || 'Unknown error')
                    }

                    // Add all incoming & outgoing edges 
                    // All types of edges are stored in database
                    // But we will only store edges corresponding to relationship type "derivedFrom"
                    if (result.edges && Array.isArray(result.edges)) {
                        // each edge is an edge table entry 
                        for (const edge of result.edges) {
                            // If edge is not "derivedFrom", then skip
                            if (edge.relationshipType !== "derivedFrom") continue;
                            // Add edge
                            const existingEdge = get().edges.get(edge.id)
                            if (!existingEdge) { // Only add to store if not existing
                                const newEdge: EtymologyEdge = {
                                    id: edge.id,
                                    source: edge.sourceId,
                                    target: edge.targetId,
                                    relationshipType: edge.relationshipType,
                                    confidence: edge.confidence,
                                    yearOfTransition: edge.yearOfTransition
                                }

                                // Add new edge to store
                                get().addEdge(newEdge)
                            }
                        }
                    }

                    const wordData = result.data
                    const { nodes, edges } = get()
                    const positions = layoutTree(wordData.id, nodes, edges)

                    // Convert to WordNode and add to store
                    const node: WordNode = {
                        id: wordData.id,
                        word: wordData.word,
                        language: wordData.language,
                        era: wordData.era,
                        definition: wordData.definition,
                        etymology: wordData.etymology,
                        position: positions.get(wordData.id) ?? { x: 400, y: 300 },
                        parentId: wordData.parentId,
                        childrenIds: [],
                        metadata: {
                            partOfSpeech: wordData.partOfSpeech,
                            firstRecorded: wordData.firstRecorded || undefined,
                            frequency: wordData.frequency || undefined
                        }
                    }


                    get().addNode(node)

                    // Add ancestor nodes
                    if (result.ancestors && Array.isArray(result.ancestors)) {
                        // each ancestor is a word table entry
                        for (const ancestor of result.ancestors) {
                            // Add ancestor node
                            const existingNode = get().nodes.get(ancestor.id)
                            if (!existingNode) { // Only add to store if not existing
                                const ancestorNode: WordNode = {
                                    id: ancestor.id,
                                    word: ancestor.word,
                                    language: ancestor.language,
                                    era: ancestor.era,
                                    definition: ancestor.definition,
                                    etymology: ancestor.etymology,
                                    position: positions.get(ancestor.id) ?? { x: 400, y: 300 },
                                    parentId: ancestor.parentId,
                                    childrenIds: [],
                                    metadata: {
                                        firstRecorded: ancestor.firstRecorded,
                                        lastRecorded: ancestor.lastRecorded,
                                        frequency: ancestor.frequency,
                                        partOfSpeech: ancestor.partOfSpeech
                                    }
                                }

                                // Add new ancestor node to store
                                get().addNode(ancestorNode)
                            }
                        }
                    }

                    // Add descendant nodes 
                    if (result.descendants && Array.isArray(result.descendants)) {
                        // each descendant is a word table entry
                        for (const descendant of result.descendants) {
                            // Add descendant node
                            const existingNode = get().nodes.get(descendant.id)
                            if (!existingNode) { // Only add to store if not existing
                                const descendantNode: WordNode = {
                                    id: descendant.id,
                                    word: descendant.word,
                                    language: descendant.language,
                                    era: descendant.era,
                                    definition: descendant.definition,
                                    etymology: descendant.etymology,
                                    position: positions.get(descendant.id) ?? { x: 400, y: 300 },
                                    parentId: descendant.parentId,
                                    childrenIds: [],
                                    metadata: {
                                        firstRecorded: descendant.firstRecorded,
                                        lastRecorded: descendant.lastRecorded,
                                        frequency: descendant.frequency,
                                        partOfSpeech: descendant.partOfSpeech
                                    }
                                }

                                // Add new descendant node to store
                                get().addNode(descendantNode)
                            }
                        }
                    }

                    // Rebuild graph using newly added word node, ancestor nodes, and ancestor edges
                    get().rebuildGraph()

                    const allWords = Array.from(get().nodes.values()).map(node => node.word);
                    console.log('All words in store:', allWords);

                } catch (error) {
                    set({ error: error instanceof Error ? error.message : 'Unknown error' })
                } finally {
                    set({ isLoading: false })
                }
            },

            findPath: async (startWordId, endWordId) => {
                const { graph } = get()
                if (!graph) return null

                const path = graph.findShortestPath(startWordId, endWordId)
                return path
            },

            selectConnectedComponent: (startNodeId: string) => {
                const { edges } = get()
                const visited = new Set<string>()
                const queue = [startNodeId]

                // BFS to find all connected nodes
                while (queue.length > 0) {
                    const currentId = queue.shift()!
                    if (visited.has(currentId)) continue

                    visited.add(currentId)

                    // Find all neighbors through edges
                    edges.forEach((edge) => {
                        if (edge.source === currentId && !visited.has(edge.target)) {
                            queue.push(edge.target)
                        }
                        if (edge.target === currentId && !visited.has(edge.source)) {
                            queue.push(edge.source)
                        }
                    })
                }

                set({
                    selectedNodeIds: visited
                })

                console.log(`Selected ${visited.size} nodes in connected component`)
            },

            clearSelection: () => {
                set({
                    selectedNodeIds: new Set()
                })
            },

            startGroupDrag: (mouseX: number, mouseY: number) => {
                const { selectedNodeIds, nodes } = get()

                if (selectedNodeIds.size === 0) return

                // Calculate the center of selected nodes
                let centerX = 0, centerY = 0
                selectedNodeIds.forEach((id) => {
                    const node = nodes.get(id)
                    if (node) {
                        centerX += node.position.x
                        centerY += node.position.y
                    }
                })
                centerX /= selectedNodeIds.size
                centerY /= selectedNodeIds.size

                set({
                    isGroupDragging: true,
                    groupDragOffset: {
                        x: mouseX - centerX,
                        y: mouseY - centerY
                    }
                })
            },

            updateGroupDrag: (mouseX: number, mouseY: number) => {
                const { isGroupDragging, groupDragOffset, selectedNodeIds, nodes } = get()

                if (!isGroupDragging || !groupDragOffset) return

                // Calculate new center position
                const newCenterX = mouseX - groupDragOffset.x
                const newCenterY = mouseY - groupDragOffset.y

                // Calculate current center
                let currentCenterX = 0, currentCenterY = 0
                selectedNodeIds.forEach((id) => {
                    const node = nodes.get(id)
                    if (node) {
                        currentCenterX += node.position.x
                        currentCenterY += node.position.y
                    }
                })
                currentCenterX /= selectedNodeIds.size
                currentCenterY /= selectedNodeIds.size

                // Calculate delta
                const deltaX = newCenterX - currentCenterX
                const deltaY = newCenterY - currentCenterY

                // Move all selected nodes
                get().moveSelectedNodes(deltaX, deltaY)
            },

            // End group dragging
            endGroupDrag: () => {
                set({
                    isGroupDragging: false,
                    groupDragOffset: null
                })
            },

            moveSelectedNodes: (deltaX: number, deltaY: number) => {
                set((state) => {
                    const newNodes = new Map(state.nodes)

                    state.selectedNodeIds.forEach((id) => {
                        const node = newNodes.get(id)
                        if (node) {
                            newNodes.set(id, {
                                ...node,
                                position: {
                                    x: node.position.x + deltaX,
                                    y: node.position.y + deltaY
                                }
                            })
                        }
                    })

                    return { nodes: newNodes }
                })

                // Rebuild graph after moving nodes
                get().rebuildGraph()
            },

            addNode: (node) => {
                set((state) => {
                    const newNodes = new Map(state.nodes)
                    if (!newNodes.get(node.id)) { newNodes.set(node.id, node) }
                    return { nodes: newNodes }
                })
            },

            addEdge: (edge) => {
                set((state) => {
                    const newEdges = new Map(state.edges)
                    if (!newEdges.get(edge.id)) {
                        newEdges.set(edge.id, edge)
                    }
                    return { edges: newEdges }
                })
            },

            clearError: () => set({ error: null }),

            rebuildGraph: () => {
                const { nodes, edges } = get()
                const graph = new EtymologyGraph(
                    Array.from(nodes.values()),
                    Array.from(edges.values())
                )
                set({ graph })
            }
        }),
        { name: 'EtymonStore' }
    )
)

// Calculate tree layout positions
const layoutTree = (
    mainNodeId: string,
    existingNodes: Map<string, WordNode>,
    edges: Map<string, EtymologyEdge>
): Map<string, Position> => {
    const positions = new Map<string, Position>()

    // Find tree root (oldest ancestor connected to main node)
    const ancestors = getAncestorsInOrder(mainNodeId, edges)
    const descendants = getDescendantsInOrder(mainNodeId, edges)

    // Calculate offset to avoid overlapping with existing trees
    const treeOffset = calculateTreeOffset(existingNodes, mainNodeId)

    // Vertical spacing
    const VERTICAL_SPACING = 250
    const HORIZONTAL_SPACING = 270

    // Find center of new family tree
    const centerX = treeOffset.x
    const centerY = treeOffset.y

    // Position main node at center
    positions.set(mainNodeId, { x: centerX, y: centerY })

    // Position ancestors (going upward)
    ancestors.forEach((ancestorId, index) => {
        const level = ancestors.length - index
        // Fan out ancestors horizontally
        const fanOut = Math.ceil((index + 1) / 2) * HORIZONTAL_SPACING * (index % 2 === 0 ? 1 : -1)
        positions.set(ancestorId, {
            x: centerX + fanOut,
            y: centerY - VERTICAL_SPACING
        })
    })

    // Position descendants (going downward)
    descendants.forEach((descendantId, index) => {
        const level = index + 1
        // Fan out descendants horizontally
        const fanOut = Math.ceil((index + 1) / 2) * HORIZONTAL_SPACING * (index % 2 === 0 ? 1 : -1)
        positions.set(descendantId, {
            x: centerX + fanOut,
            y: centerY + VERTICAL_SPACING
        })
    })

    return positions
}

// Get ancestors in order (oldest first)
const getAncestorsInOrder = (
    nodeId: string,
    edges: Map<string, EtymologyEdge>
): string[] => {
    const ancestors: string[] = []
    const queue = [nodeId]
    const visited = new Set<string>()
    visited.add(nodeId)

    while (queue.length > 0) {
        const current = queue.shift()!
        const parentEdges = Array.from(edges.values()).filter(
            e => e.target === current && e.relationshipType === 'derivedFrom'
        )
        parentEdges.forEach(edge => {
            if (!visited.has(edge.source)) {
                visited.add(edge.source)
                ancestors.push(edge.source)
                queue.push(edge.source)
            }
        })
    }

    return ancestors.reverse() // Oldest first
}

// Get descendants in order (BFS)
const getDescendantsInOrder = (
    nodeId: string,
    edges: Map<string, EtymologyEdge>
): string[] => {
    const descendants: string[] = []
    const queue = [nodeId]
    const visited = new Set<string>()
    visited.add(nodeId)

    while (queue.length > 0) {
        const current = queue.shift()!
        const childEdges = Array.from(edges.values()).filter(
            e => e.source === current && e.relationshipType === 'derivedFrom'
        )
        childEdges.forEach(edge => {
            if (!visited.has(edge.target)) {
                visited.add(edge.target)
                descendants.push(edge.target)
                queue.push(edge.target)
            }
        })
    }

    return descendants
}

// Calculate offset to place new tree away from existing ones
const calculateTreeOffset = (existingNodes: Map<string, WordNode>, nodeId: string): Position => {
    if (existingNodes.size === 0) {
        return { x: 400, y: 300 } // Center of canvas
    }

    const storedNode = existingNodes.get(nodeId)
    if (storedNode) {
        return storedNode.position
    }

    // Find the righmost x position
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    existingNodes.forEach(node => {
        maxX = Math.max(maxX, node.position.x)
        minY = Math.min(minY, node.position.y)
        maxY = Math.max(maxY, node.position.y)
    })

    // Place new tree to the right, with some vertical variation
    const treeSpacing = 800
    const verticalJitter = (maxY - minY) * 0.3

    return {
        x: maxX + treeSpacing,
        y: minY + verticalJitter + Math.random() * 100
    }
}
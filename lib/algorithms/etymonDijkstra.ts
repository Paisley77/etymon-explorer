import type { WordNode, EtymologyEdge, EtymologyPath } from '@/types/etymon.types'

interface GraphNode {
    id: string
    word: string
    edges: Map<string, number> // target ID -> weight or source ID -> weight
}

export class EtymologyGraph {
    private nodes: Map<string, GraphNode> = new Map()
    private originalEdges: Map<string, EtymologyEdge> = new Map()
    private historicalWeightMultiplier: Map<string, number> = new Map([
        ['derivedFrom', 1.0],
        ['borrowed', 1.5],      // Borrowed words are less "direct" evolution
        ['cognate', 2.0],        // Cognates are related but separate branches
        ['calque', 1.8]          // Loan translations
    ])

    constructor(words: WordNode[], edges: EtymologyEdge[]) {
        edges.forEach(edge => {
            this.originalEdges.set(edge.id, edge)
        })
        this.buildGraph(words, edges)
    }

    private buildGraph(words: WordNode[], edges: EtymologyEdge[]): void {
        // Initialize nodes
        words.forEach(word => {
            this.nodes.set(word.id, {
                id: word.id,
                word: word.word,
                edges: new Map()
            })
        })

        // Add edges (bidirectional for traversal)
        edges.forEach(edge => {
            const weight = this.calculateEdgeWeight(edge)

            // Add forward edge
            const sourceNode = this.nodes.get(edge.source)
            if (sourceNode) {
                sourceNode.edges.set(edge.target, weight)
            }

            // Add reverse edge (etymology can be traversed both ways)
            const targetNode = this.nodes.get(edge.target)
            if (targetNode) {
                targetNode.edges.set(edge.source, weight)
            }
        })
    }

    private calculateEdgeWeight(edge: EtymologyEdge): number {
        const baseWeight = this.historicalWeightMultiplier.get(edge.relationshipType) || 1.0

        // Adjust weight based on confidence (lower confidence = higher weight/cost)
        const confidenceAdjustment = 1 + (1 - edge.confidence)

        // Adjust for temporal distance if available
        let temporalAdjustment = 1.0
        if (edge.yearOfTransition) {
            const yearsAgo = 2026 - edge.yearOfTransition
            temporalAdjustment = 1 + (yearsAgo / 2000) // Normalize by 2000 years
        }

        return baseWeight * confidenceAdjustment * temporalAdjustment
    }

    findShortestPath(startId: string, endId: string): EtymologyPath | null {
        if (!this.nodes.has(startId) || !this.nodes.has(endId)) {
            return null
        }

        // Dijkstra's Algorithm
        const distances: Map<string, number> = new Map()
        const previous: Map<string, string> = new Map()
        const previousEdge: Map<string, string> = new Map()
        const unvisited: Set<string> = new Set()

        // Initialize distances
        this.nodes.forEach((_, id) => {
            distances.set(id, Infinity)
            unvisited.add(id)
        })
        distances.set(startId, 0)

        while (unvisited.size > 0) {
            // Find node with minimum distance
            let current: string | null = null
            let minDistance = Infinity

            unvisited.forEach(id => {
                const distance = distances.get(id) ?? Infinity
                if (distance < minDistance) {
                    minDistance = distance
                    current = id
                }
            })

            if (current === null || minDistance === Infinity) {
                break
            }

            // If we reached the target, we can stop
            if (current === endId) {
                break
            }

            unvisited.delete(current)

            // Update distances to neighbors
            const currentNode = this.nodes.get(current)
            if (!currentNode) continue

            const currentId = current
            currentNode.edges.forEach((weight, neighborId) => {
                if (!unvisited.has(neighborId)) return

                const alt = (distances.get(currentId) || 0) + weight
                if (alt < (distances.get(neighborId) || Infinity)) {
                    distances.set(neighborId, alt)
                    previous.set(neighborId, currentId)
                    // Store the edge ID for reconstruction
                    const edge = Array.from(this.originalEdges.values()).find(
                        e => (e.source === currentId && e.target === neighborId) ||
                            (e.source === neighborId && e.target === currentId)
                    )
                    if (edge) {
                        previousEdge.set(neighborId, edge.id)
                    }
                }
            })
        }

        // Reconstruct path
        const path: string[] = []
        const edgePath: string[] = []
        let current = endId

        while (current !== undefined) {
            path.unshift(current)
            const prev = previous.get(current)
            if (prev) {
                const edgeId = previousEdge.get(current)
                if (edgeId) edgePath.unshift(edgeId)
            }
            current = prev || ''
            if (current === '') break
        }

        // Verify we found a path
        if (path[0] !== startId) {
            return null
        }

        // Generate explanation
        const explanation = this.generatePathExplanation(path, edgePath)

        return {
            path,
            edges: edgePath,
            totalDistance: distances.get(endId) || Infinity,
            explanation
        }
    }

    private generatePathExplanation(path: string[], edgePath: string[]): string[] {
        const explanations: string[] = []

        for (let i = 0; i < path.length - 1; i++) {
            const currentId = path[i]
            const nextId = path[i + 1]

            const edge = Array.from(this.originalEdges.values()).find(
                e => e.source === currentId && e.target === nextId
            )

            const relationship = edge?.relationshipType || 'evolved from'

            const currentNode = this.nodes.get(currentId)
            const nextNode = this.nodes.get(nextId)

            if (currentNode && nextNode) {
                if (relationship !== 'evolved from') {
                    explanations.push(
                        `${currentNode.word} → `
                    )
                } else {
                    explanations.push(
                        `${currentNode.word} ← `
                    )
                }
            }
        }

        const lastId = path[path.length - 1]
        const lastNode = this.nodes.get(lastId)
        const lastNodeWord = lastNode ? lastNode.word : ""
        explanations.push(lastNodeWord)

        return explanations
    }

    // Detect cycles to prevent infinite loops
    detectCycles(): string[][] {
        const cycles: string[][] = []
        const visited: Set<string> = new Set()
        const recursionStack: Set<string> = new Set()

        const dfs = (nodeId: string, path: string[]): boolean => {
            visited.add(nodeId)
            recursionStack.add(nodeId)
            path.push(nodeId)

            const node = this.nodes.get(nodeId)
            if (node) {
                for (const neighborId of node.edges.keys()) {
                    if (!visited.has(neighborId)) {
                        if (dfs(neighborId, [...path])) {
                            return true
                        }
                    } else if (recursionStack.has(neighborId)) {
                        // Cycle detected
                        const cycleStart = path.indexOf(neighborId)
                        const cycle = path.slice(cycleStart)
                        cycle.push(neighborId)
                        cycles.push(cycle)
                        return true
                    }
                }
            }

            recursionStack.delete(nodeId)
            return false
        }

        this.nodes.forEach((_, id) => {
            if (!visited.has(id)) {
                dfs(id, [])
            }
        })

        return cycles
    }
}
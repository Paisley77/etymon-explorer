import "server-only"

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import type { WordNode, EtymologyEdge } from '@/types/etymon.types'

// Stores client on the global object so it survives reloads
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    adapter: new PrismaNeon({
        connectionString: process.env.DATABASE_URL,
    }),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export class DatabaseService {
    async getWordById(id: string) {
        return prisma.word.findUnique({
            where: { id },
            include: {
                outgoingEdges: true,
                incomingEdges: true,
                parent: true,
                children: true
            }
        })
    }

    async getWordByWordAndLanguage(word: string, language: string) {
        return prisma.word.findUnique({
            where: {
                word_language: { word, language }
            }
        })
    }

    async getWordByWordAndLanguageWithRelations(word: string, language: string) {
        return prisma.word.findUnique({
            where: {
                word_language: { word, language }
            },
            include: {
                outgoingEdges: true,
                incomingEdges: true,
                parent: true,
                children: true
            }
        })
    }

    async getAncestorsOfWord(id: string) {
        return prisma.word.findMany({
            where: {
                outgoingEdges: {
                    some: {
                        targetId: id,
                        relationshipType: "derivedFrom"
                    }
                }
            }
        })
    }

    async getDescendantsOfWord(id: string) {
        return prisma.word.findMany({
            where: {
                incomingEdges: {
                    some: {
                        sourceId: id,
                        relationshipType: "derivedFrom"
                    }
                }
            }
        })
    }

    async getAllEdges(id: string) {
        return prisma.etymologyEdge.findMany({
            where: {
                OR: [
                    { sourceId: id },
                    { targetId: id }
                ]
            }
        })
    }

    async createWord(data: any) {
        return prisma.word.upsert({
            where: {
                word_language: {
                    word: data.word,
                    language: data.language
                }
            },
            update: {
                era: data.era,
                definition: data.definition,
                etymology: data.etymology,
                partOfSpeech: data.partOfSpeech,
                firstRecorded: data.firstRecorded,
                frequency: data.frequency,
                verifiedByAI: data.verifiedByAI ?? true,
                aiConfidence: data.aiConfidence,
                updatedAt: new Date()
            },
            create: data
        })
    }

    async createEdge(data: any) {
        return prisma.etymologyEdge.upsert({
            where: {
                sourceId_targetId_relationshipType: {
                    sourceId: data.sourceId,
                    targetId: data.targetId,
                    relationshipType: data.relationshipType
                }
            },
            update: {
                confidence: data.confidence,
                yearOfTransition: data.yearOfTransition,
                updatedAt: new Date()
            },
            create: data
        })
    }

    async getCachedResponse(queryHash: string) {
        return prisma.cachedAIResponse.findUnique({
            where: { queryHash }
        })
    }

    async cacheAIResponse(cacheKey: string, prompt: string, response: any) {
        const queryHash = this.hashPrompt(cacheKey)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30) // Cache for 30 days

        return prisma.cachedAIResponse.create({
            data: {
                queryHash,
                prompt,
                response,
                expiresAt
            }
        })
    }

    private hashPrompt(prompt: string): string {
        return Buffer.from(prompt).toString('base64').slice(0, 32)
    }
}
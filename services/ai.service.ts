import { generateText, Output } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { DatabaseService } from './database.service'
import type { AIEtymologyResponse } from '@/types/etymon.types'

const EtymologyResponseSchema = z.object({
    word: z.string(),
    language: z.string(),
    era: z.string(),
    definition: z.string(),
    etymology: z.string(),
    confidence: z.number(),
    ancestors: z.array(z.object({
        word: z.string(),
        language: z.string(),
        era: z.string(),
        definition: z.string(),
        relationshipType: z.enum(['derivedFrom', 'cognate', 'borrowed', 'calque']),
        confidence: z.number(),
        yearApprox: z.number().optional()
    })),
    descendants: z.array(z.object({
        word: z.string(),
        language: z.string(),
        definition: z.string(),
        era: z.string(),
        relationshipType: z.enum(['derivedFrom', 'cognate', 'borrowed', 'calque']),
        confidence: z.number(),
        yearApprox: z.number().optional()
    })),
    cognates: z.array(z.object({
        word: z.string(),
        language: z.string(),
        definition: z.string(),
        sharedRoot: z.string()
    })),
    metadata: z.object({
        partOfSpeech: z.string(),
        firstRecorded: z.number().optional(),
        frequency: z.number().optional()
    })
})

export class AIService {
    private db: DatabaseService

    constructor() {
        this.db = new DatabaseService()
    }

    async exploreEtymology(word: string, language: string = 'Modern English'): Promise<AIEtymologyResponse> {
        // Build the prompt
        const prompt = this.buildEtymologyPrompt(word, language)

        // Check cache first
        const cacheKey = `etymology:${word}:${language}`
        const queryHash = Buffer.from(cacheKey).toString('base64').slice(0, 32)
        const cached = await this.db.getCachedResponse(queryHash)

        if (cached) {
            console.log('Cache hit for:', word)
            try {
                const validated = EtymologyResponseSchema.parse(cached.response)
                return validated as AIEtymologyResponse
            } catch (error) {
                console.warn('Cached response invalid, fetching fresh: ', error)
            }
        }

        console.log('Querying AI for:', word)

        // Generate with structured output
        const result = await generateText({
            model: anthropic('claude-sonnet-4-6'),
            prompt,
            temperature: 0.3, // Lower temperature for more consistent, factual responses
            maxOutputTokens: 2000,
            output: Output.object({ schema: EtymologyResponseSchema }),
        })

        const object = result.output;

        // Cache the response
        await this.db.cacheAIResponse(cacheKey, prompt, object)

        return object as AIEtymologyResponse
    }

    private buildEtymologyPrompt(word: string, language: string): string {
        return `You are a historical linguist and etymology expert. Provide detailed etymological information for the word "${word}" (${language}).

                Your task:
                1. Provide a clear, concise definition
                2. Trace the word's origin back through history (Latin, Greek, Proto-Germanic, Proto-Indo-European, etc.)
                3. Identify direct ancestors (words it directly evolved from)
                4. Identify modern descendants (words that evolved from it)
                5. Identify cognates (related words in other languages from the same root)
                6. Include approximate years when available

                Important guidelines:
                - Be historically accurate and cite established etymological sources
                - For ancestors: trace backwards in time (e.g., Modern English → Middle English → Old English → Proto-Germanic → PIE)
                - For descendants: trace forwards in time where applicable
                - Confidence scores should be 0.0-1.0 based on scholarly consensus
                - If information is uncertain, note it in the etymology field but still provide best scholarly estimates
                - For years: use negative numbers for BCE (e.g., -400 for 400 BCE)

                Format the response as structured data matching the schema exactly.`
    }

    async findPathBetweenWords(
        startWord: string,
        endWord: string,
        language: string = 'Modern English'
    ): Promise<{
        path: string[],
        explanation: string,
        commonAncestor: string
    }> {
        const prompt = `You are an expert historical linguist. Find the etymological connection between "${startWord}" and "${endWord}" (both in ${language}).

                        Trace their lineage back to find:
                        1. Their most recent common ancestor word
                        2. The evolutionary path that connects them
                        3. A clear explanation of how they're related

                        Return a structured response with:
                        - The chain of words connecting them (as an array)
                        - A detailed explanation of the linguistic changes
                        - The common ancestor word

                        If they are not related (different PIE roots), state that clearly.`

        const result = await generateText({
            model: anthropic('claude-sonnet-4-6'),
            prompt,
            temperature: 0.3,
            maxOutputTokens: 1000,
            output: Output.object({
                schema: z.object({
                    path: z.array(z.string()),
                    explanation: z.string(),
                    commonAncestor: z.string(),
                    related: z.boolean()
                })
            })
        })

        return {
            path: result.output.path,
            explanation: result.output.explanation,
            commonAncestor: result.output.commonAncestor
        }
    }
}
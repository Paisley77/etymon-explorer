export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/services/ai.service'
import { DatabaseService } from '@/services/database.service'
import { describe } from 'zod/v4/core'
import { Dai_Banna_SIL } from 'next/font/google'

const aiService = new AIService()
const dbService = new DatabaseService()

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { word, language = 'Modern English' } = body
        console.log("Searching for word " + word)

        if (!word) {
            return NextResponse.json(
                { error: 'Word is required' },
                { status: 400 }
            )
        }
        // Check database cache first
        const existingWord = await dbService.getWordByWordAndLanguageWithRelations(word, language)
        const cacheKey = `etymology:${word}:${language}`
        const queryHash = Buffer.from(cacheKey).toString('base64').slice(0, 32)
        const cached = await dbService.getCachedResponse(queryHash)

        if (cached && existingWord) {
            // ancestors = all word entries that have outgoingEdges to existingWord
            const ancestors = await dbService.getAncestorsOfWord(existingWord.id)
            // descendants = all word entries that have incomingEdges from existingWord
            const descendants = await dbService.getDescendantsOfWord(existingWord.id)
            // edges = all incoming & outgoing edge entries from existingWord
            const edges = await dbService.getAllEdges(existingWord.id)
            // return word entry data + ancestors data + edges data
            return NextResponse.json({
                success: true,
                data: existingWord,
                ancestors: ancestors,
                descendants: descendants,
                edges: edges,
                source: 'database'
            })
        }

        // Query AI
        const aiResponse = await aiService.exploreEtymology(word, language)

        // Save to database
        const savedWord = await dbService.createWord({
            word: aiResponse.word,
            language: aiResponse.language,
            era: aiResponse.era,
            definition: aiResponse.definition,
            etymology: aiResponse.etymology,
            partOfSpeech: aiResponse.metadata.partOfSpeech,
            firstRecorded: aiResponse.metadata.firstRecorded,
            frequency: aiResponse.metadata.frequency,
            verifiedByAI: true,
            aiConfidence: aiResponse.confidence
        })

        // Process ancestors
        const savedAncestors = []
        const savedIncomingEdges = []

        for (const ancestor of aiResponse.ancestors) {
            let ancestorData = await dbService.getWordByWordAndLanguage(
                ancestor.word,
                ancestor.language
            )

            if (!ancestorData) {
                ancestorData = await dbService.createWord({
                    word: ancestor.word,
                    language: ancestor.language,
                    era: ancestor.era,
                    definition: ancestor.definition,
                    etymology: '',
                    partOfSpeech: 'noun',
                    firstRecorded: ancestor.yearApprox
                })
            }

            savedAncestors.push(ancestorData)

            // Create new edge or update existing edge
            const edge = await dbService.createEdge({
                sourceId: ancestorData.id,
                targetId: savedWord.id,
                relationshipType: ancestor.relationshipType,
                confidence: ancestor.confidence,
                yearOfTransition: ancestor.yearApprox
            })

            savedIncomingEdges.push(edge)
        }

        // Process descendents 
        const savedDescendents = []
        const savedOutgoingEdges = []

        for (const descendant of aiResponse.descendants) {
            let descendantData = await dbService.getWordByWordAndLanguage(
                descendant.word,
                descendant.language
            )

            if (!descendantData) {
                descendantData = await dbService.createWord({
                    word: descendant.word,
                    language: descendant.language,
                    era: descendant.era,
                    definition: descendant.definition,
                    etymology: '',
                    parentId: savedWord.id,
                    partOfSpeech: 'noun'
                })
            }

            savedDescendents.push(descendantData)

            // Create new edge or update existing edge
            const edge = await dbService.createEdge({
                sourceId: savedWord.id,
                targetId: descendantData.id,
                relationshipType: descendant.relationshipType,
                confidence: descendant.confidence,
                yearOfTransition: descendant.yearApprox
            })

            savedOutgoingEdges.push(edge)
        }

        return NextResponse.json({
            success: true,
            data: savedWord,
            ancestors: savedAncestors,
            descendants: savedDescendents,
            edges: [...savedIncomingEdges, ...savedOutgoingEdges],
            source: 'ai'
        })

    } catch (error) {
        console.error('Etymology API error:', error)
        return NextResponse.json(
            { error: 'Failed to process etymology request' },
            { status: 500 }
        )
    }
}
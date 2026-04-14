import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/services/ai.service'

const aiService = new AIService()

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { startWord, endWord, language = 'Modern English' } = body

        if (!startWord || !endWord) {
            return NextResponse.json(
                { error: 'Both start and end words are required' },
                { status: 400 }
            )
        }

        const pathResult = await aiService.findPathBetweenWords(
            startWord,
            endWord,
            language
        )

        return NextResponse.json({
            success: true,
            data: pathResult
        })

    } catch (error) {
        console.error('Path API error:', error)
        return NextResponse.json(
            { error: 'Failed to find etymology path' },
            { status: 500 }
        )
    }
}
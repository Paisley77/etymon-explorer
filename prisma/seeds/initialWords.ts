import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const prisma = new PrismaClient({
    adapter: new PrismaNeon({
        connectionString: process.env.DATABASE_URL,
    })
})

const initialWords = [
    {
        word: 'etymology',
        language: 'Modern English',
        era: 'modern',
        definition: 'The study of the origin of words and the way in which their meanings have changed throughout history',
        etymology: 'From Latin "etymologia", from Greek "etymon" (true sense) + "logia" (study)',
        partOfSpeech: 'noun',
        firstRecorded: 1398,
        frequency: 0.3
    },
    {
        word: 'etymologia',
        language: 'Latin',
        era: 'medieval',
        definition: 'Study of word origins',
        etymology: 'Borrowed from Greek "etymologia"',
        partOfSpeech: 'noun',
        firstRecorded: 500,
        frequency: 0.1
    },
    {
        word: 'ἐτυμολογία',
        language: 'Greek',
        era: 'ancient',
        definition: 'Analysis of a word to find its true origin',
        etymology: 'From "etymon" (true sense) + "-logia" (study of)',
        partOfSpeech: 'noun',
        firstRecorded: -300,
        frequency: 0.05
    }
]

async function main() {
    console.log('Seeding database...')

    for (const word of initialWords) {
        await prisma.word.upsert({
            where: {
                word_language: {
                    word: word.word,
                    language: word.language
                }
            },
            update: {},
            create: word
        })
    }

    console.log('Seed completed')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, title } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ tags: [], error: 'GEMINI_API_KEY not set' }, { status: 200 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are a product tagging AI for an Indian shopping platform.

    Given this product title: "${title}"

    Return a JSON array of 5-8 relevant tags in lowercase English for personalization.
    Focus on: product type, target audience, use case, vibe (trendy/value/home/tech), price tier (budget/mid/premium).

    Example: ["women-fashion", "budget", "occasion-wear", "trending", "gift-idea"]

    Return ONLY the JSON array, nothing else.`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ tags: [] })
    }

    const tags = JSON.parse(jsonMatch[0])
    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Gemini tagging error:', error)
    return NextResponse.json({ tags: [], error: 'Tagging failed' }, { status: 200 })
  }
}

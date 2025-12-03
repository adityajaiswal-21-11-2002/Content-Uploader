import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface CoderTopicsResponse {
  coder_topics: Array<{
    employee: string
    topic: string
  }>
}

export interface PeeperTopicsResponse {
  peeper_topics: Array<{
    employee: string
    topic: string
  }>
}

export interface InstagramTopicsResponse {
  insta_topics: string[]
}

/**
 * Generate unique YouTube topics for coders
 */
export async function generateCoderTopics(
  coderNames: string[]
): Promise<CoderTopicsResponse> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `
Generate unique, trending YouTube technical topics for coders.
Each topic should be engaging, relevant to programming, and suitable for a technical audience.

Employees:
${coderNames.map((name) => `- ${name}`).join("\n")}

Return JSON:
{
  "coder_topics": [
    { "employee": "${coderNames[0]}", "topic": "..." },
    { "employee": "${coderNames[1]}", "topic": "..." },
    { "employee": "${coderNames[2]}", "topic": "..." }
  ]
}

Make each topic unique, specific, and actionable.
`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error("No content received from OpenAI")
    }

    return JSON.parse(content) as CoderTopicsResponse
  } catch (error) {
    console.error("Error generating coder topics:", error)
    throw error
  }
}

/**
 * Generate unique YouTube topics for peepers (editing, VFX, Photoshop, 3D)
 */
export async function generatePeeperTopics(
  peeperNames: string[]
): Promise<PeeperTopicsResponse> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `
Generate unique, trending YouTube topics related to:
- Video Editing
- Photoshop
- VFX (Visual Effects)
- 3D Animation

Each topic should be engaging and suitable for creators in these fields.

Employees:
${peeperNames.map((name) => `- ${name}`).join("\n")}

Return JSON:
{
  "peeper_topics": [
    { "employee": "${peeperNames[0]}", "topic": "..." },
    { "employee": "${peeperNames[1]}", "topic": "..." },
    { "employee": "${peeperNames[2]}", "topic": "..." }
  ]
}

Make each topic unique, specific, and actionable.
`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error("No content received from OpenAI")
    }

    return JSON.parse(content) as PeeperTopicsResponse
  } catch (error) {
    console.error("Error generating peeper topics:", error)
    throw error
  }
}

/**
 * Generate 7 unique Instagram reel topics for Rohini, Delhi
 */
export async function generateInstagramTopics(): Promise<InstagramTopicsResponse> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `
Generate 7 unique Instagram reel topics related to Rohini, Delhi locality.
Topics should be relevant to local content, lifestyle, culture, or trending topics in Delhi/Rohini area.

Return JSON:
{
  "insta_topics": [
    "Topic 1",
    "Topic 2",
    "Topic 3",
    "Topic 4",
    "Topic 5",
    "Topic 6",
    "Topic 7"
  ]
}

Make each topic unique, engaging, and suitable for Instagram reels format.
`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error("No content received from OpenAI")
    }

    return JSON.parse(content) as InstagramTopicsResponse
  } catch (error) {
    console.error("Error generating Instagram topics:", error)
    throw error
  }
}


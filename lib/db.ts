import { MongoClient, type Db } from "mongodb"

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

async function connectToDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb
  }

  const mongoUrl = process.env.DATABASE_URL
  if (!mongoUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  try {
    const client = new MongoClient(mongoUrl)
    await client.connect()
    cachedClient = client
    cachedDb = client.db("content_upload_tracker")
    console.log("[v0] Connected to MongoDB successfully")
    return cachedDb
  } catch (error) {
    console.error("[v0] MongoDB connection error:", error)
    throw error
  }
}

async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const db = await connectToDatabase()

  // Since we're using MongoDB now, this is a placeholder that returns empty array
  // Routes should use connectToDatabase() directly for MongoDB operations
  console.warn("[v0] Using query() helper - please migrate to connectToDatabase() for MongoDB operations")
  return []
}

export { connectToDatabase, query }

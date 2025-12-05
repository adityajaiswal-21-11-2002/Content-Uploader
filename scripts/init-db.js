/**
 * Standalone script to initialize the database
 * Run with: node scripts/init-db.js
 * 
 * Make sure to set DATABASE_URL in your .env or .env.local file in the root directory
 * This script will automatically load variables from .env.local (if exists) or .env
 * Next.js will automatically load .env.local and .env files as well
 */

// Read .env or .env.local file directly (no dotenv dependency needed)
const fs = require('fs')
const path = require('path')

function loadEnvFile(fileName) {
  const envPath = path.join(__dirname, '..', fileName)
  if (fs.existsSync(envPath)) {
    try {
      const envFile = fs.readFileSync(envPath, 'utf8')
      envFile.split('\n').forEach(line => {
        const trimmedLine = line.trim()
        // Skip comments and empty lines
        if (!trimmedLine || trimmedLine.startsWith('#')) return
        
        const match = trimmedLine.match(/^([^#=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          let value = match[2].trim()
          // Remove quotes if present
          value = value.replace(/^["']|["']$/g, '')
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      })
      return true
    } catch (e) {
      console.log(`Warning: Could not read ${fileName}:`, e.message)
      return false
    }
  }
  return false
}

// Try .env.local first, then .env
if (!loadEnvFile('.env.local')) {
  if (!loadEnvFile('.env')) {
    console.log('Note: No .env or .env.local file found, using environment variables directly')
  } else {
    console.log('✓ Loaded environment variables from .env')
  }
} else {
  console.log('✓ Loaded environment variables from .env.local')
}

const { MongoClient } = require('mongodb')

const employees = [
  {
    id: 1,
    name: "Aditya Jaiswal",
    role: "coder",
    email: "aditya.jaiswal@example.com",
    weekly_required_yt: 3,
    weekly_required_insta: 7,
  },
  {
    id: 2,
    name: "Vipin Sharma",
    role: "coder",
    email: "vipin.sharma@example.com",
    weekly_required_yt: 3,
    weekly_required_insta: 7,
  },
  {
    id: 3,
    name: "Vikash Sharma",
    role: "coder",
    email: "vikash.sharma@example.com",
    weekly_required_yt: 3,
    weekly_required_insta: 7,
  },
  {
    id: 4,
    name: "Rohit",
    role: "pepper",
    email: "rohit.edit@example.com",
    weekly_required_yt: 3,
    weekly_required_insta: 7,
  },
  {
    id: 5,
    name: "Pawan Sharma",
    role: "pepper",
    email: "pawan.sharma@example.com",
    weekly_required_yt: 3,
    weekly_required_insta: 7,
  },
  {
    id: 6,
    name: "Annu",
    role: "pepper",
    email: "annu.edit@example.com",
    weekly_required_yt: 3,
    weekly_required_insta: 7,
  },
]

async function initializeDatabase() {
  const mongoUrl = process.env.DATABASE_URL
  if (!mongoUrl) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  const client = new MongoClient(mongoUrl)
  
  try {
    await client.connect()
    console.log("✅ Connected to MongoDB")
    
    const db = client.db("content_upload_tracker")
    const employeesCollection = db.collection("employees")

    // Upsert employees
    console.log("📝 Inserting employees...")
    for (const employee of employees) {
      await employeesCollection.updateOne(
        { id: employee.id },
        {
          $set: {
            ...employee,
            created_at: new Date(),
          },
        },
        { upsert: true }
      )
      console.log(`  ✓ ${employee.name}`)
    }

    // Create indexes
    console.log("📊 Creating indexes...")
    await employeesCollection.createIndex({ id: 1 }, { unique: true })
    await employeesCollection.createIndex({ email: 1 }, { unique: true })
    await db.collection("topics_daily").createIndex({ date: 1, employee_id: 1, platform: 1 })
    await db.collection("uploads").createIndex({ employee_id: 1, date: 1, platform: 1 })
    await db.collection("weekly_reports").createIndex({ week: 1, employee_id: 1 }, { unique: true })
    console.log("  ✓ Indexes created")

    console.log("\n✅ Database initialized successfully!")
    console.log(`   ${employees.length} employees added`)
  } catch (error) {
    console.error("❌ Error initializing database:", error)
    throw error
  } finally {
    await client.close()
  }
}

initializeDatabase()
  .then(() => {
    console.log("\n🎉 Done!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Failed:", error.message)
    process.exit(1)
  })


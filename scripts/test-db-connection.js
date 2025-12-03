/**
 * Database Connection Test Script
 * Verifies MongoDB connection and collections
 * 
 * Usage: node scripts/test-db-connection.js
 */

const fs = require('fs')
const path = require('path')

// Load environment variables
function loadEnvFile(fileName) {
  const envPath = path.join(__dirname, '..', fileName)
  if (fs.existsSync(envPath)) {
    try {
      const envFile = fs.readFileSync(envPath, 'utf8')
      envFile.split('\n').forEach(line => {
        const trimmedLine = line.trim()
        if (!trimmedLine || trimmedLine.startsWith('#')) return
        const match = trimmedLine.match(/^([^#=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          let value = match[2].trim().replace(/^["']|["']$/g, '')
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      })
      return true
    } catch (e) {
      return false
    }
  }
  return false
}

loadEnvFile('.env.local') || loadEnvFile('.env')

async function testDatabase() {
  const { MongoClient } = require('mongodb')
  
  const mongoUrl = process.env.DATABASE_URL
  if (!mongoUrl) {
    console.error('❌ DATABASE_URL not found in environment variables')
    process.exit(1)
  }
  
  console.log('🔌 Testing database connection...\n')
  
  const client = new MongoClient(mongoUrl)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB successfully\n')
    
    const db = client.db('content_upload_tracker')
    console.log('📊 Checking collections...\n')
    
    // List all collections
    const collections = await db.listCollections().toArray()
    console.log(`Found ${collections.length} collection(s):`)
    collections.forEach(col => {
      console.log(`  - ${col.name}`)
    })
    console.log()
    
    // Check employees collection
    console.log('👥 Checking employees collection...')
    const employeesCount = await db.collection('employees').countDocuments()
    console.log(`  Employees: ${employeesCount}`)
    
    if (employeesCount > 0) {
      const employees = await db.collection('employees').find({}).limit(3).toArray()
      console.log('  Sample employees:')
      employees.forEach(emp => {
        console.log(`    - ${emp.name} (${emp.role}) - YT: ${emp.weekly_required_yt || 'N/A'}, Insta: ${emp.weekly_required_insta || 'N/A'}`)
      })
    } else {
      console.log('  ⚠️  No employees found. Run database initialization.')
    }
    console.log()
    
    // Check topics_daily collection
    console.log('📝 Checking topics_daily collection...')
    const topicsCount = await db.collection('topics_daily').countDocuments()
    console.log(`  Topics: ${topicsCount}`)
    
    if (topicsCount > 0) {
      const today = new Date().toISOString().split('T')[0]
      const todayTopics = await db.collection('topics_daily').countDocuments({ date: today })
      console.log(`  Today's topics: ${todayTopics}`)
    }
    console.log()
    
    // Check uploads collection
    console.log('⬆️  Checking uploads collection...')
    const uploadsCount = await db.collection('uploads').countDocuments()
    console.log(`  Uploads: ${uploadsCount}`)
    
    if (uploadsCount > 0) {
      const ytCount = await db.collection('uploads').countDocuments({ platform: 'youtube' })
      const instaCount = await db.collection('uploads').countDocuments({ platform: 'instagram' })
      console.log(`  YouTube: ${ytCount}, Instagram: ${instaCount}`)
    }
    console.log()
    
    // Check weekly_reports collection
    console.log('📊 Checking weekly_reports collection...')
    const reportsCount = await db.collection('weekly_reports').countDocuments()
    console.log(`  Reports: ${reportsCount}`)
    console.log()
    
    // Check indexes
    console.log('🔍 Checking indexes...')
    const employeesIndexes = await db.collection('employees').indexes()
    console.log(`  employees indexes: ${employeesIndexes.length}`)
    employeesIndexes.forEach(idx => {
      console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}`)
    })
    
    console.log('\n✅ Database check completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Database check failed:')
    console.error(`   Error: ${error.message}`)
    process.exit(1)
  } finally {
    await client.close()
    console.log('\n🔌 Connection closed')
  }
}

testDatabase()


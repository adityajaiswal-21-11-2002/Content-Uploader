/**
 * Debug script to check topics in database
 */

const { MongoClient } = require('mongodb')
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

async function debugTopics() {
  const mongoUrl = process.env.DATABASE_URL
  if (!mongoUrl) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  const client = new MongoClient(mongoUrl)
  
  try {
    await client.connect()
    const db = client.db('content_upload_tracker')
    
    const today = new Date().toISOString().split('T')[0]
    console.log(`\n📅 Today's date (ISO): ${today})`)
    console.log(`📅 Current date object: ${new Date()}`)
    console.log(`📅 UTC date: ${new Date().toUTCString()}\n`)
    
    // Check all topics in topics_daily collection
    const allTopics = await db.collection('topics_daily').find({}).sort({ created_at: -1 }).limit(20).toArray()
    
    console.log(`\n📊 Found ${allTopics.length} recent topics in database\n`)
    
    if (allTopics.length > 0) {
      // Group by date
      const byDate = {}
      allTopics.forEach(topic => {
        if (!byDate[topic.date]) {
          byDate[topic.date] = []
        }
        byDate[topic.date].push(topic)
      })
      
      console.log('📅 Topics grouped by date:')
      Object.keys(byDate).sort().reverse().forEach(date => {
        console.log(`\n  ${date}: ${byDate[date].length} topics`)
        const byEmployee = {}
        byDate[date].forEach(t => {
          if (!byEmployee[t.employee_id]) {
            byEmployee[t.employee_id] = { youtube: 0, insta: 0 }
          }
          byEmployee[t.employee_id][t.platform]++
        })
        Object.keys(byEmployee).forEach(empId => {
          console.log(`    Employee ${empId}: ${byEmployee[empId].youtube} YouTube, ${byEmployee[empId].insta} Instagram`)
        })
      })
      
      // Check for today's topics
      const todayTopics = await db.collection('topics_daily').find({ date: today }).toArray()
      console.log(`\n✅ Topics for today (${today}): ${todayTopics.length}`)
      
      if (todayTopics.length === 0) {
        console.log('\n⚠️  No topics found for today!')
        console.log('   Checking if topics exist for other dates...')
        const dates = Object.keys(byDate).sort().reverse()
        if (dates.length > 0) {
          console.log(`   Latest date with topics: ${dates[0]}`)
          console.log(`   This might be a timezone issue.`)
        }
      } else {
        // Check for employee 1
        const emp1Topics = todayTopics.filter(t => t.employee_id === 1 || t.employee_id === '1')
        console.log(`\n   Employee 1 topics: ${emp1Topics.length}`)
        emp1Topics.forEach(t => {
          console.log(`     - ${t.platform}: ${t.topic.substring(0, 50)}...`)
        })
      }
    } else {
      console.log('❌ No topics found in database at all!')
    }
    
    // Check employees
    const employees = await db.collection('employees').find({}).toArray()
    console.log(`\n👥 Employees in database: ${employees.length}`)
    employees.forEach(emp => {
      console.log(`   - ID: ${emp.id}, Name: ${emp.name}, Role: ${emp.role}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

debugTopics()


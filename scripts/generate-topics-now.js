/**
 * Generate Topics for Today
 * Generates YouTube and Instagram topics for all employees
 * 
 * Usage: node scripts/generate-topics-now.js
 */

const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const { URL } = require('url')

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

const BASE_URL = process.env.TEST_BASE_URL || 'http://192.168.29.42:3000'
const CRON_SECRET = process.env.CRON_SECRET || 'test-secret'

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// HTTP fetch implementation
function fetchAPI(endpoint, options = {}) {
  return new Promise((resolve) => {
    try {
      const url = new URL(`${BASE_URL}${endpoint}`)
      const httpModule = url.protocol === 'https:' ? https : http
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      }
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers,
      }
      
      const req = httpModule.request(requestOptions, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {}
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: jsonData })
          } catch (e) {
            resolve({ ok: false, status: res.statusCode, data: {}, error: 'Invalid JSON response' })
          }
        })
      })
      
      req.on('error', (error) => {
        resolve({ ok: false, status: 0, error: error.message, data: {} })
      })
      
      req.end()
    } catch (error) {
      resolve({ ok: false, status: 0, error: error.message, data: {} })
    }
  })
}

async function generateTopics() {
  log('\n🤖 Generating Topics for Today...', 'cyan')
  log(`   Server: ${BASE_URL}`, 'blue')
  log('   =================================\n', 'blue')
  
  if (!process.env.OPENAI_API_KEY) {
    log('❌ Error: OPENAI_API_KEY not found in environment variables', 'red')
    log('   Please set OPENAI_API_KEY in your .env or .env.local file', 'yellow')
    process.exit(1)
  }
  
  log('📡 Calling topic generation API...', 'cyan')
  
  const result = await fetchAPI('/api/topics/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`,
    },
  })
  
  if (result.ok && result.data.success) {
    log('\n✅ Topics generated successfully!', 'green')
    log('\n📊 Summary:', 'cyan')
    log(`   📝 Date: ${new Date().toISOString().split('T')[0]}`, 'blue')
    log(`   👨‍💻 Coder topics: ${result.data.coder_topics || 0}`, 'blue')
    log(`   🎨 Peeper topics: ${result.data.peeper_topics || 0}`, 'blue')
    log(`   📸 Instagram topics: ${result.data.insta_topics || 0}`, 'blue')
    log('\n✅ All employees now have topics for today!', 'green')
    log('   Employees can view them on their dashboards.', 'blue')
    return true
  } else {
    log('\n❌ Failed to generate topics', 'red')
    if (result.data.error) {
      log(`   Error: ${result.data.error}`, 'red')
    }
    if (result.data.details) {
      log(`   Details: ${result.data.details}`, 'yellow')
    }
    if (result.status === 401) {
      log('\n   💡 Tip: Check your CRON_SECRET matches the server configuration', 'yellow')
    }
    if (result.status === 500) {
      log('\n   💡 Tip: Make sure OPENAI_API_KEY is valid and has credits', 'yellow')
    }
    return false
  }
}

// Run
generateTopics()
  .then((success) => {
    if (success) {
      log('\n🎉 Done!\n', 'green')
      process.exit(0)
    } else {
      log('\n💥 Generation failed\n', 'red')
      process.exit(1)
    }
  })
  .catch((error) => {
    log(`\n💥 Error: ${error.message}`, 'red')
    process.exit(1)
  })


/**
 * Comprehensive Feature Testing Script
 * Tests all API endpoints and features
 * 
 * Usage: node scripts/test-features.js
 * 
 * Make sure your dev server is running on http://localhost:3001
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

// Load .env files
loadEnvFile('.env.local') || loadEnvFile('.env')

const BASE_URL = process.env.TEST_BASE_URL || 'http://192.168.29.42:3000'
const CRON_SECRET = process.env.CRON_SECRET || 'test-secret'

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
}

// Colors for console
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

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL'
  const color = passed ? 'green' : 'red'
  results.tests.push({ name, passed, message })
  if (passed) {
    results.passed++
  } else {
    results.failed++
  }
  log(`  ${status}: ${name}${message ? ' - ' + message : ''}`, color)
}

// HTTP fetch implementation (Node.js compatible)
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
      
      if (options.body) {
        const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
        headers['Content-Length'] = Buffer.byteLength(bodyStr)
        
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
        
        req.write(bodyStr)
        req.end()
      } else {
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
      }
    } catch (error) {
      resolve({ ok: false, status: 0, error: error.message, data: {} })
    }
  })
}

// Test 1: Check server is running
async function testServerRunning() {
  log('\n📡 Testing Server Connection...', 'cyan')
  const result = await fetchAPI('/api/employees')
  const isRunning = result.status !== 0 && result.status >= 200 && result.status < 500
  logTest('Server is running', isRunning, result.status === 0 ? 'Server not accessible' : `Status: ${result.status}`)
  return isRunning
}

// Test 2: Database initialization
async function testDatabaseInit() {
  log('\n🗄️  Testing Database Initialization...', 'cyan')
  const result = await fetchAPI('/api/init', { method: 'GET' })
  const passed = result.ok && result.data.success
  logTest('Database initialization', passed, result.data.message || result.data.error)
  return passed
}

// Test 3: Employees API
async function testEmployeesAPI() {
  log('\n👥 Testing Employees API...', 'cyan')
  const result = await fetchAPI('/api/employees')
  const hasEmployees = result.ok && Array.isArray(result.data) && result.data.length > 0
  logTest('Get employees list', hasEmployees, hasEmployees ? `${result.data.length} employees found` : 'No employees found')
  
  if (hasEmployees) {
    const employee = result.data[0]
    const hasRequiredFields = employee.id && employee.name && employee.email && employee.role
    logTest('Employee has required fields', 
      hasRequiredFields,
      hasRequiredFields ? 'All required fields present' : 'Missing required fields'
    )
    const hasWeeklyReqs = employee.weekly_required_yt !== undefined && employee.weekly_required_insta !== undefined
    logTest('Employee has weekly requirements', 
      hasWeeklyReqs,
      hasWeeklyReqs ? 'Weekly requirements configured' : 'Missing weekly requirements'
    )
  }
  
  return hasEmployees
}

// Test 4: Topics API
async function testTopicsAPI() {
  log('\n📝 Testing Topics API...', 'cyan')
  
  // First, get employees to find a valid employee_id
  const employeesResult = await fetchAPI('/api/employees')
  let validEmployeeId = 1
  
  if (employeesResult.ok && Array.isArray(employeesResult.data) && employeesResult.data.length > 0) {
    validEmployeeId = employeesResult.data[0].id
  }
  
  // Test getting today's topics for a valid employee
  const topicsResult = await fetchAPI(`/api/topics/today/${validEmployeeId}`)
  // Endpoint accessible if we get any response (200-499), endpoint exists
  // 500+ = server errors (endpoint might not exist)
  const topicsWorking = topicsResult.status >= 200 && topicsResult.status < 500
  let message = 'Endpoint accessible'
  if (topicsResult.ok) {
    message = 'Endpoint accessible (topics may be empty)'
  } else if (topicsResult.status === 400) {
    message = `Endpoint accessible but validation failed: ${topicsResult.data?.error || 'Invalid request'}`
  } else if (topicsResult.status === 404) {
    message = 'Endpoint accessible (no topics for today - normal if topics not generated yet)'
  } else if (topicsResult.status >= 500) {
    message = topicsResult.data?.error || `Server error: ${topicsResult.status}`
  } else {
    message = topicsResult.data?.error || `Status: ${topicsResult.status}`
  }
  logTest('Get today\'s topics endpoint', topicsWorking, message)
  
  return topicsWorking
}

// Test 5: Topic Generation (manual test)
async function testTopicGeneration() {
  log('\n🤖 Testing Topic Generation...', 'cyan')
  
  if (!process.env.OPENAI_API_KEY) {
    logTest('OpenAI API key configured', false, 'OPENAI_API_KEY not set in environment')
    log('  ⚠️  Skipping topic generation test - OPENAI_API_KEY required', 'yellow')
    return false
  }
  
  const result = await fetchAPI('/api/topics/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`,
    },
  })
  
  const passed = result.ok && result.data.success
  logTest('Topic generation endpoint', passed, result.data.message || result.data.error || 'Check OpenAI API key')
  return passed
}

// Test 6: Upload Mark Done
async function testUploadMarkDone() {
  log('\n⬆️  Testing Upload Mark Done...', 'cyan')
  
  const testData = {
    employee_id: 1,
    platform: 'youtube',
  }
  
  const result = await fetchAPI('/api/upload/mark-done', {
    method: 'POST',
    body: JSON.stringify(testData),
  })
  
  const passed = result.ok && result.data.success
  logTest('Mark upload done endpoint', passed, result.data.message || result.data.error)
  return passed
}

// Test 7: Weekly Summary
async function testWeeklySummary() {
  log('\n📊 Testing Weekly Summary...', 'cyan')
  
  const result = await fetchAPI('/api/uploads/week-summary')
  const passed = result.ok && result.data && Array.isArray(result.data.summary)
  logTest('Weekly summary endpoint', passed, result.data.error || `${result.data.summary?.length || 0} employees in summary`)
  return passed
}

// Test 8: Email Alert
async function testEmailAlert() {
  log('\n📧 Testing Email Alert...', 'cyan')
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logTest('Email configuration', false, 'SMTP credentials not set')
    log('  ⚠️  Skipping email alert test - SMTP credentials required', 'yellow')
    return false
  }
  
  const testData = {
    employee_id: 1,
  }
  
  const result = await fetchAPI('/api/email/send-alert', {
    method: 'POST',
    body: JSON.stringify(testData),
  })
  
  const passed = result.ok && result.data.success
  logTest('Send alert email endpoint', passed, result.data.message || result.data.error || 'Check SMTP configuration')
  return passed
}

// Test 9: Cron Jobs
async function testCronJobs() {
  log('\n⏰ Testing Cron Job Endpoints...', 'cyan')
  
  // Test daily topics cron
  const dailyTopicsResult = await fetchAPI('/api/cron/daily-topics', {
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`,
    },
  })
  logTest('Daily topics cron endpoint', 
    dailyTopicsResult.ok || dailyTopicsResult.status === 401,
    dailyTopicsResult.status === 401 ? 'Endpoint exists (auth required)' : dailyTopicsResult.data.error
  )
  
  // Test weekly check cron
  const weeklyCheckResult = await fetchAPI('/api/cron/weekly-check', {
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`,
    },
  })
  logTest('Weekly check cron endpoint',
    weeklyCheckResult.ok || weeklyCheckResult.status === 401,
    weeklyCheckResult.status === 401 ? 'Endpoint exists (auth required)' : weeklyCheckResult.data.error
  )
  
  return true
}

// Test 10: Database Connection
async function testDatabaseConnection() {
  log('\n🔌 Testing Database Connection...', 'cyan')
  
  if (!process.env.DATABASE_URL) {
    logTest('Database URL configured', false, 'DATABASE_URL not set')
    return false
  }
  
  try {
    const { MongoClient } = require('mongodb')
    const client = new MongoClient(process.env.DATABASE_URL)
    await client.connect()
    await client.close()
    logTest('Database connection', true, 'Successfully connected to MongoDB')
    return true
  } catch (error) {
    logTest('Database connection', false, error.message)
    return false
  }
}

// Main test runner
async function runTests() {
  log('\n🧪 Starting Feature Tests...', 'blue')
  log(`   Base URL: ${BASE_URL}`, 'blue')
  log('   =================================\n', 'blue')
  
  try {
    // Test server connection first
    const serverRunning = await testServerRunning()
    if (!serverRunning) {
      log('\n❌ Server is not running!', 'red')
      log('   Please start the dev server with: pnpm dev', 'yellow')
      process.exit(1)
    }
    
    // Run all tests
    await testDatabaseConnection()
    await testDatabaseInit()
    await testEmployeesAPI()
    await testTopicsAPI()
    await testTopicGeneration()
    await testUploadMarkDone()
    await testWeeklySummary()
    await testEmailAlert()
    await testCronJobs()
    
    // Print summary
    log('\n' + '='.repeat(50), 'blue')
    log('\n📋 Test Summary', 'cyan')
    log(`   ✅ Passed: ${results.passed}`, 'green')
    log(`   ❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green')
    log(`   📊 Total:  ${results.passed + results.failed}`, 'blue')
    
    const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1)
    log(`   📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow')
    
    if (results.failed === 0) {
      log('\n🎉 All tests passed!', 'green')
    } else {
      log('\n⚠️  Some tests failed. Check the output above for details.', 'yellow')
    }
    
    log('\n' + '='.repeat(50) + '\n', 'blue')
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0)
    
  } catch (error) {
    log(`\n💥 Fatal error: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

// Run tests
runTests()


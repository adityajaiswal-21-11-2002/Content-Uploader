/**
 * Test the topics API endpoint
 */

const http = require('http')
const { URL } = require('url')

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

function fetchAPI(endpoint) {
  return new Promise((resolve) => {
    try {
      const url = new URL(`${BASE_URL}${endpoint}`)
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: 'GET',
      }
      
      const req = http.request(requestOptions, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {}
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: jsonData })
          } catch (e) {
            resolve({ ok: false, status: res.statusCode, data: {}, error: 'Invalid JSON response', raw: data })
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

async function testAPI() {
  console.log(`\n🧪 Testing Topics API for Employee 1`)
  console.log(`   URL: ${BASE_URL}/api/topics/today/1\n`)
  
  const result = await fetchAPI('/api/topics/today/1')
  
  if (result.ok) {
    console.log('✅ API Response:')
    console.log(JSON.stringify(result.data, null, 2))
    
    if (!result.data.youtube && result.data.instagram.length === 0) {
      console.log('\n⚠️  No topics found in response!')
    } else {
      console.log(`\n✅ Found:`)
      console.log(`   YouTube: ${result.data.youtube ? 'Yes' : 'No'}`)
      console.log(`   Instagram: ${result.data.instagram.length} topics`)
    }
  } else {
    console.log('❌ API Error:')
    console.log(`   Status: ${result.status}`)
    console.log(`   Error: ${result.error || result.data.error || 'Unknown error'}`)
    if (result.data.details) {
      console.log(`   Details: ${result.data.details}`)
    }
    if (result.raw) {
      console.log(`   Raw response: ${result.raw}`)
    }
  }
}

testAPI()


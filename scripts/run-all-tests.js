/**
 * Master Test Runner
 * Runs all test scripts in sequence
 * 
 * Usage: node scripts/run-all-tests.js
 */

const { spawn } = require('child_process')
const path = require('path')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function runScript(scriptName, description) {
  return new Promise((resolve, reject) => {
    log(`\n${'='.repeat(60)}`, 'blue')
    log(`📋 Running: ${description}`, 'cyan')
    log(`   Script: ${scriptName}`, 'blue')
    log('='.repeat(60), 'blue')
    
    const scriptPath = path.join(__dirname, scriptName)
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: true,
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        log(`\n✅ ${description} completed successfully`, 'green')
        resolve(true)
      } else {
        log(`\n❌ ${description} failed with code ${code}`, 'red')
        resolve(false)
      }
    })
    
    child.on('error', (error) => {
      log(`\n💥 Error running ${scriptName}: ${error.message}`, 'red')
      reject(error)
    })
  })
}

async function main() {
  log('\n' + '='.repeat(60), 'magenta')
  log('🧪 MASTER TEST RUNNER', 'magenta')
  log('   Running all feature tests', 'magenta')
  log('='.repeat(60), 'magenta')
  
  const results = []
  
  try {
    // Test 1: Database connection
    const dbTest = await runScript('test-db-connection.js', 'Database Connection Test')
    results.push({ name: 'Database Connection', passed: dbTest })
    
    // Test 2: Feature tests (API endpoints)
    const featureTest = await runScript('test-features.js', 'Feature Tests')
    results.push({ name: 'Feature Tests', passed: featureTest })
    
    // Print final summary
    log('\n' + '='.repeat(60), 'magenta')
    log('📊 FINAL SUMMARY', 'magenta')
    log('='.repeat(60), 'magenta')
    
    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌'
      const color = result.passed ? 'green' : 'red'
      log(`${icon} ${result.name}`, color)
    })
    
    const allPassed = results.every(r => r.passed)
    const passedCount = results.filter(r => r.passed).length
    
    log('\n' + '-'.repeat(60), 'blue')
    log(`Total: ${passedCount}/${results.length} test suites passed`, 'blue')
    
    if (allPassed) {
      log('\n🎉 All test suites passed!', 'green')
      log('   Your system is ready for production!', 'green')
      process.exit(0)
    } else {
      log('\n⚠️  Some test suites failed', 'yellow')
      log('   Please review the output above and fix any issues.', 'yellow')
      process.exit(1)
    }
    
  } catch (error) {
    log(`\n💥 Fatal error: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

main()


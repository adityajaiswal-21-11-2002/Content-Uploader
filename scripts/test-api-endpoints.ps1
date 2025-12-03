# API Endpoint Testing Script for PowerShell
# Tests all API endpoints
# 
# Usage: .\scripts\test-api-endpoints.ps1
# Make sure your dev server is running first

$BASE_URL = $env:TEST_BASE_URL
if (-not $BASE_URL) {
    $BASE_URL = "http://192.168.29.42:3000"
}

$CRON_SECRET = $env:CRON_SECRET
if (-not $CRON_SECRET) {
    $CRON_SECRET = "test-secret"
}

$script:PASSED = 0
$script:FAILED = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [string]$Body = $null,
        [string]$Auth = $null
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Cyan
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($Auth) {
        $headers["Authorization"] = "Bearer $Auth"
    }
    
    try {
        if ($Method -eq "GET") {
            if ($Auth) {
                $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method GET -Headers $headers -ErrorAction Stop
            } else {
                $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method GET -ErrorAction Stop
            }
            $statusCode = 200
        } else {
            $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method $Method -Headers $headers -Body $Body -ErrorAction Stop
            $statusCode = 200
        }
        
        Write-Host "✅ PASS: $Name (HTTP $statusCode)" -ForegroundColor Green
        $script:PASSED++
        return $true
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if (-not $statusCode) {
            $statusCode = 0
        }
        
        Write-Host "❌ FAIL: $Name (HTTP $statusCode)" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        $script:FAILED++
        return $false
    }
    Write-Host ""
}

Write-Host "🧪 Testing API Endpoints" -ForegroundColor Blue
Write-Host "Base URL: $BASE_URL" -ForegroundColor Blue
Write-Host "=================================" -ForegroundColor Blue
Write-Host ""

# Test 1: Server health check
Test-Endpoint -Name "Server Health Check" -Method "GET" -Endpoint "/api/employees"

# Test 2: Database initialization
Test-Endpoint -Name "Database Initialization" -Method "GET" -Endpoint "/api/init"

# Test 3: Get employees
Test-Endpoint -Name "Get Employees" -Method "GET" -Endpoint "/api/employees"

# Test 4: Get today's topics
Test-Endpoint -Name "Get Today's Topics" -Method "GET" -Endpoint "/api/topics/today/1"

# Test 5: Weekly summary
Test-Endpoint -Name "Weekly Summary" -Method "GET" -Endpoint "/api/uploads/week-summary"

# Test 6: Mark upload done
Test-Endpoint -Name "Mark Upload Done" -Method "POST" -Endpoint "/api/upload/mark-done" -Body '{"employee_id":1,"platform":"youtube"}'

# Test 7: Send alert
Test-Endpoint -Name "Send Alert Email" -Method "POST" -Endpoint "/api/email/send-alert" -Body '{"employee_id":1}'

# Test 8: Cron - Daily topics
Test-Endpoint -Name "Cron: Daily Topics" -Method "GET" -Endpoint "/api/cron/daily-topics" -Auth $CRON_SECRET

# Test 9: Cron - Weekly check
Test-Endpoint -Name "Cron: Weekly Check" -Method "GET" -Endpoint "/api/cron/weekly-check" -Auth $CRON_SECRET

# Summary
Write-Host "=================================" -ForegroundColor Blue
Write-Host "📋 Test Summary" -ForegroundColor Cyan
Write-Host "✅ Passed: $script:PASSED" -ForegroundColor Green
Write-Host "❌ Failed: $script:FAILED" -ForegroundColor Red
Write-Host "📊 Total:  $($script:PASSED + $script:FAILED)" -ForegroundColor Blue
Write-Host ""

if ($script:FAILED -eq 0) {
    Write-Host "🎉 All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some tests failed" -ForegroundColor Yellow
    exit 1
}


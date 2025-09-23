# Database Connection Test Script
param(
    [string]$DatabaseUrl = $env:DATABASE_URL
)

Write-Host "=== Database Connection Test ===" -ForegroundColor Green

if (-not $DatabaseUrl) {
    Write-Host "ERROR: DATABASE_URL environment variable not set" -ForegroundColor Red
    Write-Host "Please set it like:" -ForegroundColor Yellow
    Write-Host '$env:DATABASE_URL="postgresql://postgres:password@host:5432/database"' -ForegroundColor Yellow
    exit 1
}

Write-Host "DATABASE_URL provided: $($DatabaseUrl.Substring(0, [Math]::Min(50, $DatabaseUrl.Length)))..." -ForegroundColor Cyan

# Parse the URL
try {
    $uri = [System.Uri]::new($DatabaseUrl)
    $userInfo = $uri.UserInfo.Split(':')
<<<<<<< HEAD
    $dbUser = [System.Uri]::UnescapeDataString($userInfo[0])
    $dbPass = if ($userInfo.Length -gt 1) { [System.Uri]::UnescapeDataString($userInfo[1]) } else { "" }
    $dbHost = $uri.Host
    $dbPort = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
    $dbName = $uri.AbsolutePath.TrimStart('/')
    
    $connectionString = "Host=$dbHost;Port=$dbPort;Database=$dbName;Username=$dbUser;Password=$dbPass;Ssl Mode=Require;Trust Server Certificate=true"
    
    Write-Host "Parsed connection details:" -ForegroundColor Cyan
    Write-Host "  Host: $dbHost" -ForegroundColor White
    Write-Host "  Port: $dbPort" -ForegroundColor White
    Write-Host "  Database: $dbName" -ForegroundColor White
    Write-Host "  Username: $dbUser" -ForegroundColor White
    Write-Host "  Password: $(if($dbPass) { '****' } else { 'Not provided' })" -ForegroundColor White
=======
    $user = [System.Uri]::UnescapeDataString($userInfo[0])
    $pass = if ($userInfo.Length -gt 1) { [System.Uri]::UnescapeDataString($userInfo[1]) } else { "" }
    $host = $uri.Host
    $port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
    $db = $uri.AbsolutePath.TrimStart('/')
    
    $connectionString = "Host=$host;Port=$port;Database=$db;Username=$user;Password=$pass;Ssl Mode=Require;Trust Server Certificate=true"
    
    Write-Host "Parsed connection details:" -ForegroundColor Cyan
    Write-Host "  Host: $host" -ForegroundColor White
    Write-Host "  Port: $port" -ForegroundColor White
    Write-Host "  Database: $db" -ForegroundColor White
    Write-Host "  Username: $user" -ForegroundColor White
    Write-Host "  Password: $(if($pass) { '****' } else { 'Not provided' })" -ForegroundColor White
>>>>>>> 31661b9c5ee7a4659c8a001772398a4ee6657951
    
} catch {
    Write-Host "ERROR: Failed to parse DATABASE_URL: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test the backend endpoints
$backendUrl = "https://sap-basis-pulseolddeleted-main-production.up.railway.app"

Write-Host "`nTesting health endpoint..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "$backendUrl/api/status/health" -Method GET
    Write-Host "✓ Health check passed" -ForegroundColor Green
    Write-Host "  Status: $($healthResponse.status)" -ForegroundColor White
    Write-Host "  Environment: $($healthResponse.environment)" -ForegroundColor White
} catch {
    Write-Host "✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTesting database connection endpoint..." -ForegroundColor Cyan
try {
    $dbResponse = Invoke-RestMethod -Uri "$backendUrl/api/status/db-check" -Method GET
    Write-Host "✓ Database connection test completed" -ForegroundColor Green
    Write-Host "  Can Connect: $($dbResponse.canConnect)" -ForegroundColor $(if($dbResponse.canConnect) { "Green" } else { "Red" })
    Write-Host "  Connection String: $($dbResponse.connectionString)" -ForegroundColor White
    
    if ($dbResponse.details) {
        Write-Host "  Server Details:" -ForegroundColor White
        $dbResponse.details.PSObject.Properties | ForEach-Object {
            Write-Host "    $($_.Name): $($_.Value)" -ForegroundColor Gray
        }
    }
    
    if ($dbResponse.error) {
        Write-Host "  Error: $($dbResponse.error)" -ForegroundColor Red
        if ($dbResponse.innerException) {
            Write-Host "  Inner Exception: $($dbResponse.innerException)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "✗ Database connection test failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green
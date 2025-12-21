#!/usr/bin/env pwsh
# Script to clean restart the dev server

Write-Host "Stopping any running Node processes..." -ForegroundColor Yellow

# Stop all node processes (will kill dev servers)
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Waiting for processes to stop..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Starting fresh dev server..." -ForegroundColor Green
npm run dev


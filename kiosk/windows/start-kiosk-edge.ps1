param(
    [string]$ExamUrl = "http://localhost:4000/assessment.html"
)

$edgeCandidates = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe"
)

$edgePath = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edgePath) {
    Write-Error "Microsoft Edge was not found. Install Edge or use the Chrome kiosk script."
    exit 1
}

# Close existing Edge windows so kiosk starts cleanly.
Get-Process msedge -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

$args = @(
    "--kiosk",
    $ExamUrl,
    "--edge-kiosk-type=fullscreen",
    "--inprivate",
    "--no-first-run",
    "--disable-features=msNurturingFeatures,msHistoryClusters,Translate",
    "--overscroll-history-navigation=0",
    "--disable-pinch",
    "--kiosk-idle-timeout-minutes=0"
)

Start-Process -FilePath $edgePath -ArgumentList $args | Out-Null
Write-Host "Edge kiosk started at $ExamUrl"

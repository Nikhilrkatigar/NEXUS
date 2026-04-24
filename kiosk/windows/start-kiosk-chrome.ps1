param(
    [string]$ExamUrl = "http://localhost:4000/assessment.html"
)

$chromeCandidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "$env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe"
)

$chromePath = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chromePath) {
    Write-Error "Google Chrome was not found. Install Chrome or use the Edge kiosk script."
    exit 1
}

# Close existing Chrome windows so kiosk starts cleanly.
Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

$args = @(
    "--kiosk",
    $ExamUrl,
    "--incognito",
    "--no-first-run",
    "--disable-features=TranslateUI",
    "--overscroll-history-navigation=0",
    "--disable-pinch"
)

Start-Process -FilePath $chromePath -ArgumentList $args | Out-Null
Write-Host "Chrome kiosk started at $ExamUrl"

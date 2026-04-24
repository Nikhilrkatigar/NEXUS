param(
    [switch]$Force
)

$names = @("msedge", "chrome")

foreach ($name in $names) {
    $procs = Get-Process $name -ErrorAction SilentlyContinue
    if (-not $procs) {
        continue
    }

    foreach ($proc in $procs) {
        if ($Force) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        } else {
            Stop-Process -Id $proc.Id -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "Kiosk browser processes stopped."

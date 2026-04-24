param(
    [ValidateSet("edge", "chrome")]
    [string]$Browser = "edge",

    [string]$ExamUrl = "http://localhost:4000/assessment.html",

    [string]$TaskName = "NEXUS-Assessment-Kiosk",

    [string]$UserName = "$env:USERDOMAIN\$env:USERNAME"
)

$root = Split-Path -Parent $PSScriptRoot
$scriptName = if ($Browser -eq "chrome") { "start-kiosk-chrome.ps1" } else { "start-kiosk-edge.ps1" }
$launcher = Join-Path $PSScriptRoot $scriptName

if (-not (Test-Path $launcher)) {
    Write-Error "Launcher script not found: $launcher"
    exit 1
}

$escapedLauncher = '"' + $launcher + '"'
$escapedUrl = '"' + $ExamUrl + '"'
$args = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File $escapedLauncher -ExamUrl $escapedUrl"

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $args
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $UserName
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId $UserName -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

Write-Host "Installed kiosk startup task '$TaskName' for user '$UserName'."
Write-Host "Browser: $Browser"
Write-Host "URL: $ExamUrl"

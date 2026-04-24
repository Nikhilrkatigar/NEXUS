# Kiosk Deployment Guide (Windows)

This guide locks exam devices into assessment mode as much as practical for web-based tests.

## What You Get

- Fullscreen kiosk launch for Edge or Chrome.
- Auto-start kiosk at user logon with a scheduled task.
- Stop script for invigilators/admin.

## Files Added

- `kiosk/windows/start-kiosk-edge.ps1`
- `kiosk/windows/start-kiosk-chrome.ps1`
- `kiosk/windows/stop-kiosk.ps1`
- `kiosk/windows/install-kiosk-startup-task.ps1`
- `kiosk/windows/remove-kiosk-startup-task.ps1`

## 1. Prepare the Exam URL

Set the URL that student devices should open:

- Local server: `http://localhost:4000/assessment.html`
- LAN server: `http://<server-ip>:4000/assessment.html`
- Hosted server: `https://your-domain/assessment.html`

Use HTTPS for remote deployments.

## 2. Quick Manual Launch (single PC)

Open PowerShell as the exam user and run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\kiosk\windows\start-kiosk-edge.ps1 -ExamUrl "http://localhost:4000/assessment.html"
```

Chrome option:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\kiosk\windows\start-kiosk-chrome.ps1 -ExamUrl "http://localhost:4000/assessment.html"
```

## 3. Auto-Start Kiosk at Login (recommended)

Run PowerShell as Administrator:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\kiosk\windows\install-kiosk-startup-task.ps1 -Browser edge -ExamUrl "http://localhost:4000/assessment.html" -UserName "LAB-PC\\Student01"
```

Test it immediately:

```powershell
Start-ScheduledTask -TaskName "NEXUS-Assessment-Kiosk"
```

Remove if needed:

```powershell
.\kiosk\windows\remove-kiosk-startup-task.ps1
```

## 4. Recommended OS Lockdown (important)

For stronger kiosk security, configure these on student PCs:

1. Use a dedicated standard (non-admin) Windows account for students.
2. Enable Windows Assigned Access (single-app kiosk) when available.
3. Disable Task Manager, command prompt, and registry tools for student account via Local Group Policy.
4. Disable `Win + R`, `Alt + Tab`, and other shell shortcuts for the student account via policy.
5. Restrict network egress with firewall to only your exam server and required services.
6. Disable external storage and screenshot utilities via endpoint policy.

## 5. Invigilator Controls

Stop kiosk browser if needed:

```powershell
.\kiosk\windows\stop-kiosk.ps1 -Force
```

## 6. Validation Checklist

1. Student login opens directly to assessment URL.
2. Browser launches fullscreen kiosk mode.
3. Student cannot navigate away using normal browser controls.
4. Exam anti-cheat events (tab switch/blur/screenshot shortcuts) trigger violations.
5. Submission reaches backend and appears in CMS results.

## Security Note

No web app can guarantee absolute screenshot prevention on unmanaged devices. Kiosk mode + OS policy + device management gives the best practical protection.

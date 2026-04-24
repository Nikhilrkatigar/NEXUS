# Deployment Guide

## Standard App Deployment

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/nexus_event_management
JWT_SECRET=replace-this-with-a-strong-secret
```

3. Start server:

```bash
npm start
```

4. Verify URLs:

- Public: `http://localhost:4000/`
- CMS: `http://localhost:4000/cms/login.html`
- Assessment: `http://localhost:4000/assessment.html`

## Kiosk Deployment for Exam Devices

For locked-down student exam machines, use:

- `KIOSK_DEPLOYMENT.md`
- `kiosk/windows/start-kiosk-edge.ps1`
- `kiosk/windows/start-kiosk-chrome.ps1`
- `kiosk/windows/install-kiosk-startup-task.ps1`

This gives fullscreen browser kiosk launch and optional auto-start at student logon.

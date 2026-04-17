## NEXUS MERN Rebuild Prompt

Use the prompt below with ChatGPT/Codex/Claude or any full-stack code generator:

```text
Build a complete, production-ready MERN version of my existing project called "NEXUS - The Leadership Shift", an inter-college event management platform.

I do not want a basic demo. I want a polished, modern, responsive full-stack web app with strong UI/UX, smooth animations, and clean code structure.

Tech stack:
- Frontend: React + Vite
- Styling: Tailwind CSS or SCSS modules
- Animation: Framer Motion for page and component animation, GSAP for premium scroll effects where needed
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT-based authentication with role-based access control
- File Uploads: Multer
- Optional enhancements: React Router, Axios, React Hook Form, Zod/Yup validation, Lenis smooth scroll

Project goal:
Rebuild my current NEXUS event management website and CMS into a proper MERN architecture while preserving the same product purpose and features, but making the UI more premium and interactive.

Existing product concept:
- Public landing page for NEXUS event fest
- Registration system for teams
- Event listing and rules
- Timeline/schedule section
- Team/contributors/leadership section
- Admin CMS dashboard
- Role-based login for superadmin, organiser, viewer, judge, and check-in staff
- Registration management
- Score entry and championship tracking
- User management
- Audit log
- Settings and timeline editor
- Media/image upload support
- Payment screenshot upload and payment verification
- Check-in flow

Important event/business rules to preserve:
- Main team registration supports 5 members
- Team composition rule: 2 HR + 2 Marketing + 1 Finance
- Cultural participation support:
  - Dance: max 4 members
  - Ramp walk: max 1 member
- Registration should store:
  - college
  - address
  - email
  - team name
  - faculty name
  - faculty phone
  - team leader
  - participants with name, phone, department, leader flag
  - registered events
  - category
  - payment status
  - payment screenshot
  - check-in status
- Roles:
  - superadmin: full control
  - organiser: registrations, scores, operational tools
  - viewer: read-only CMS access
  - judge: score entry for assigned event
  - checkin: check-in related access only

Main pages to build:
1. Public landing page
2. Events page / animated event section
3. Registration page with multi-step form
4. Payment screenshot upload flow
5. Public success / confirmation state
6. Admin login page
7. CMS dashboard
8. Registrations management page
9. Scores management page
10. Championship / leaderboard page
11. Timeline editor page
12. Settings page
13. About / contributors management page
14. Users and roles management page
15. Audit log page
16. Check-in page

Frontend design direction:
- Make it feel like a premium college fest / startup event website
- Use bold typography, glowing gradients, subtle textures, layered cards, and modern spacing
- Keep the design professional, not childish
- Fully responsive for mobile, tablet, and desktop
- Add dark luxurious event-brand aesthetics using black, gold, crimson, and electric cyan accents, or a similarly refined palette

Animation requirements:
- Elegant animated hero section
- Staggered reveal on scroll
- Animated counters/stat cards
- Smooth section transitions
- Hover animations on event cards, buttons, and team cards
- Animated timeline
- Modal transitions for event rules/details
- Dashboard cards with motion and micro-interactions
- Page transition animations between routes
- Loading states and skeletons
- Avoid overdoing animations; they should feel premium and smooth

Suggested premium interactions:
- Floating orb / gradient background effects in hero
- Mouse-reactive highlights where appropriate
- Magnetic CTA buttons
- Soft parallax on hero/media sections
- Animated progress indicator in registration flow
- Toast notifications and confirmation states

Public site content structure:
- Hero
- About event
- Stats
- Event categories / event cards
- Timeline
- Registration CTA
- Team / organisers / contributors
- Footer

Admin/CMS functionality:
- Secure login with JWT
- Protected routes
- Role-based authorization middleware
- Dashboard with summary cards:
  - total registrations
  - pending payments
  - verified teams
  - checked-in teams
  - active events
- Manage registrations
- Filter/search registrations
- Verify payment screenshots
- Score teams event-wise and round-wise
- Judge portal limited to assigned event
- Editable settings for landing page text, stats, images, branding, and team members
- Editable timeline
- Upload team member images and site assets
- Create/update/delete users
- Audit log for major CMS actions

Database models:
- User
- Registration
- ScoreSheet
- Settings
- Timeline
- AuditLog

Recommended backend API modules:
- /api/auth
- /api/public
- /api/registrations
- /api/scores
- /api/settings
- /api/timeline
- /api/users
- /api/audit
- /api/uploads
- /api/checkin

Implementation expectations:
- Use clean reusable React components
- Use organized folders for pages, layouts, hooks, services, context, utils, and components
- Keep API layer separate
- Add client-side and server-side validation
- Use environment variables properly
- Protect secrets
- Add error handling and empty states
- Add seed data for initial admin user and demo settings
- Write a clean README with setup steps

Deliverables I want:
1. Full frontend and backend source code
2. Proper folder structure for MERN
3. Ready-to-run setup instructions
4. `.env.example`
5. Seed script
6. Clean sample data
7. Final project packaged as a ZIP file

Output format:
- First show the final folder structure
- Then generate all source code files
- Make the app functional, not pseudo-code
- Ensure the code is coherent across frontend and backend
- At the end, provide steps to run locally
- Finally package the complete project into a zip named `nexus-mern-project.zip`

Bonus if possible:
- PWA support
- CSV export for registrations or audit
- Dashboard charts
- Image optimization
- Accessibility improvements

Very important:
- Do not create a generic template
- Build this as a real branded NEXUS event management product
- Preserve the domain logic for team composition and role-based CMS workflow
- Make the frontend visually impressive with tasteful animation
- Keep code readable and maintainable
```

Tip:
If you want, I can also scaffold the actual MERN folder structure for this project in the current repo next.

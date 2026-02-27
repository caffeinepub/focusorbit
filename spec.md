# FocusOrbit

## Current State
FocusOrbit is a space-themed Pomodoro tracker with:
- Digital clock timer with session themes (Nature, Space, Discipline, Scientist, Alien)
- Session labels: Launch Bias (1-2), Persistence (3-4), Perseverance (5+)
- Rocket launch animations scaling with session count
- Streaks with freeze system (start with 2 freezes, earn 1 every 21-day milestone)
- Consistency tab with goals/commitments and 2026 emoji streak calendar
- Analytics tab with weekly/monthly/all-time charts, CSV/PDF export, double-confirm reset
- Start/Pause/Reset/Session-reset controls on main page
- Backend stores data per Principal (caller identity)
- Currently uses anonymous browser-based identity -- data is lost if browser site data is cleared or Chrome is reinstalled

## Requested Changes (Diff)

### Add
- Internet Identity login using the Caffeine `authorization` component
- Login/welcome screen shown only when user is not authenticated
- Persistent login session so user is not asked to log in every time they open the app
- Logout button accessible from the app (e.g. in Settings tab)
- User's data (sessions, streak, goals, settings) tied to their Internet Identity principal -- portable across devices and browsers

### Modify
- App entry point: check auth state on load; show login screen if unauthenticated, show main app if authenticated
- All backend calls already use `caller` principal -- no backend logic change needed; the authorization component handles identity wiring

### Remove
- Nothing removed

## Implementation Plan
1. Select `authorization` Caffeine component
2. Regenerate backend (no functional changes, but authorization component may add identity scaffolding)
3. Frontend: wrap App with auth provider from the authorization component
4. Frontend: create a `LoginScreen` component with Internet Identity login button, space theme matching the app
5. Frontend: show `LoginScreen` if not logged in, main app if logged in
6. Frontend: add logout button in Settings tab
7. Frontend: ensure login session persists (standard behavior of the authorization component)
8. Validate, typecheck, build

## UX Notes
- Login screen should match space/scientific theme -- dark background, glowing button, brief tagline
- After first login, user lands directly on the timer (no re-login on subsequent visits)
- Logout should be tucked away in Settings -- not prominent, to avoid accidental logout
- On logout, clear local UI state and return to login screen

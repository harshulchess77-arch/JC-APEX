# JC-APEX Navigation Flows

## Route Structure

### Public Routes (No Auth Required)
- `/` - Landing page
- `/login` - Role selection page
- `/command-center` - Redirects to `/pit`

### Error Pages
- `/404` - Not Found
- `/500` - Server Error
- `/403` - Forbidden

### Protected Routes (Require Passcode Auth)
- `/pit` - Pit Center (Main dashboard)
- `/driver` - Driver HUD
- `/director` - Race Director
- `/drivers` - Driver Profile
- `/strategy-library` - Strategy Library
- `/championship-standings` - Championship Standings
- `/telemetry-dashboard` - Telemetry Dashboard
- `/circuit-map` - Circuit Map
- `/settings` - App Settings
- `/live-comms` - Live Communications
- `/benchmarks` - Benchmarks

## Navigation Patterns

### Cross-Role Navigation
All main pages have navigation buttons to switch between roles:
- **Pit Center** → Driver HUD (`/driver`)
- **Pit Center** → Race Director (`/director`)
- **Driver HUD** → Pit Center (`/pit`)
- **Race Director** → Pit Center (`/pit`)
- **Race Director** → Driver HUD (`/driver`)

### Back Navigation
Secondary pages have back buttons to return to Pit Center:
- **Circuit Map** → Pit Center (`/pit`)
- **Driver Profile** → Pit Center (`/pit`)
- **Vehicle Config** → Pit Center (`/pit`)
- **Live Comms** → Pit Center (`/pit`)
- **Benchmarks** → Pit Center (`/pit`)
- **Telemetry Dashboard** → Pit Center (`/pit`)

### Auth Flows
- **Login** → Redirects to appropriate role route
- **Logout** → Navigates to `/login`
- **Unauthorized** → Redirects to `/login` with state

### Error Page Navigation
- **404** → Back (`navigate(-1)`) or Home (`/`)
- **500** → Home (`/`)
- **403** → Login (`/login`) or Home (`/`)

## Verified Navigation Links

All navigation links have been verified to match the route definitions in `App.jsx`. The navigation system is consistent across the application with proper error handling and authentication guards.

# VantageEdge Frontend v2 - Modern API Gateway Dashboard

A completely redesigned, production-ready dashboard for VantageEdge API Gateway with synchronized authentication and modern UI/UX.

## 🎨 What's New

### Unique Design Elements
- **Space Grotesk Font** - Modern, geometric sans-serif
- **Purple/Pink Gradient Theme** - Distinctive color palette
- **Glassmorphism Effects** - Modern frosted glass UI
- **Framer Motion Animations** - Smooth, delightful interactions
- **Grid & Dot Patterns** - Subtle background textures
- **Gradient Text** - Eye-catching headings
- **Custom Animations** - Shimmer, fade, scale effects

### Authentication Synchronization
- **Auto-sync with Backend** - User and tenant automatically synced on login
- **Clerk Integration** - Beautiful, secure authentication
- **Organization Support** - Multi-tenant with Clerk organizations
- **Token Management** - Automatic JWT token handling in API calls

### Architecture Improvements
- **Type-Safe API Client** - Full TypeScript support
- **Auth Sync Service** - Dedicated service for backend synchronization
- **Theme Support** - Dark/light mode with next-themes
- **Improved State Management** - React Query + Zustand
- **Better Error Handling** - Comprehensive error interceptors

## 🚀 Quick Start

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment**
```bash
cp .env.example .env.local
# Add your Clerk keys
```

3. **Run development server**
```bash
npm run dev
```

4. **Open browser**
http://localhost:3000

## 📦 What's Included

### Pages
- ✅ Unique landing page with modern design
- ✅ Glassmorphic auth pages (sign-in/sign-up)
- ✅ Dashboard shell with sidebar navigation
- ✅ Overview page with animated stats
- 🚧 Services management (structure ready)
- 🚧 Routes configuration (structure ready)
- 🚧 API Keys (structure ready)
- 🚧 Analytics dashboard (structure ready)
- 🚧 Cache explorer (structure ready)
- 🚧 Settings page (structure ready)

### Components
- ✅ Button (with variants)
- ✅ Card (with glassmorphism)
- ✅ Dashboard shell
- ✅ Auth sync provider
- 🚧 Table, Dialog, Select (to be added)

### Features
- ✅ Automatic user/tenant sync with backend
- ✅ JWT token handling in API calls
- ✅ Responsive sidebar navigation
- ✅ Dark/light theme support
- ✅ Animated page transitions
- ✅ Modern loading states

## 🔄 Auth Synchronization Flow

1. User signs in with Clerk
2. Frontend gets Clerk user ID and organization
3. AuthSync component automatically calls backend:
   - POST /api/v1/auth/sync-user
   - POST /api/v1/auth/sync-tenant (if org exists)
4. Backend creates/updates user and tenant records
5. All subsequent API calls include JWT token
6. Backend validates token and maps to internal user/tenant

## 🎯 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom animations
- **UI Library**: Radix UI primitives
- **Auth**: Clerk (with org support)
- **Animations**: Framer Motion
- **Data Fetching**: TanStack Query
- **API Client**: Axios with interceptors
- **Theme**: next-themes
- **Toast**: Sonner
- **Forms**: React Hook Form + Zod

## 📁 Project Structure

```
app/
├── auth/
│   ├── sign-in/         # Clerk sign in
│   └── sign-up/         # Clerk sign up
├── dashboard/
│   ├── layout.tsx       # Dashboard shell
│   └── page.tsx         # Overview page
├── layout.tsx           # Root layout
├── page.tsx             # Landing page
└── globals.css          # Custom styles

components/
├── dashboard/
│   └── shell.tsx        # Sidebar + header
├── ui/
│   ├── button.tsx
│   └── card.tsx
└── providers.tsx        # Query + Theme + Auth sync

lib/
├── api/
│   ├── client.ts        # Server API client
│   ├── client-api.ts    # Browser API client
│   └── auth-sync.ts     # Auth synchronization
├── types/
│   └── index.ts         # TypeScript types
└── utils.ts             # Utilities
```

## 🔑 Environment Variables

```env
# Clerk (REQUIRED)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard/onboarding

# API
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8000
```

## 🎨 Design System

### Colors
- Primary: Purple (#8B5CF6)
- Secondary: Slate
- Success: Green (#22C55E)
- Warning: Orange (#F97316)
- Destructive: Red (#EF4444)

### Typography
- Font: Space Grotesk (geometric sans-serif)
- Headings: Bold with tight tracking
- Gradient text for emphasis

### Effects
- Glassmorphism: bg-background/80 + backdrop-blur-xl
- Shadows: Subtle, layered
- Animations: Smooth, purposeful
- Patterns: Grid and dot backgrounds

## 🔧 Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Docker
```bash
docker build -t vantageedge-frontend .
docker run -p 3000:3000 vantageedge-frontend
```

## 🔐 Backend Integration

This frontend is designed to work with the VantageEdge Go backend:

1. Backend must implement auth sync endpoints:
   - POST /api/v1/auth/sync-user
   - POST /api/v1/auth/sync-tenant
   - GET /api/v1/auth/me
   - GET /api/v1/auth/tenant

2. Backend must validate Clerk JWT tokens

3. Backend must map Clerk user/org IDs to internal IDs

## ✨ Next Steps

1. Complete CRUD pages (Services, Routes, API Keys)
2. Add data tables with sorting/filtering
3. Implement analytics charts with Recharts
4. Add cache explorer functionality
5. Complete settings page
6. Add real-time updates with WebSockets

## 📝 Notes

- Auth sync happens automatically on every sign-in
- All API calls include JWT token
- Theme persists across sessions
- Responsive design works on all devices

---

**Version 2.0** - Completely redesigned with modern UI/UX and perfect backend synchronization
# vantageedge-fe

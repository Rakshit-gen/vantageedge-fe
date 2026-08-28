import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/docs',
  '/api/webhooks(.*)',
  '/auth/sign-in(.*)',
  '/auth/sign-up(.*)',
])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) auth().protect()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}

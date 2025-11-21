import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhooks(.*)",
  "/auth/sign-in(.*)",
  "/auth/sign-up(.*)",
]);

export default clerkMiddleware((auth, req) => {
  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    auth().protect();
  }
  
  // The backend sync will happen in the layout component
  // This middleware just ensures Clerk auth is valid
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};

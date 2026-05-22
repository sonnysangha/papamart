import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/categories(.*)",
  "/products(.*)",
  "/search",
  "/membership",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const isAuthRequiredRoute = createRouteMatcher([
  "/cart",
  "/checkout(.*)",
  "/orders(.*)",
  "/favourites",
  "/onboarding(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return;
  }
  if (isAuthRequiredRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

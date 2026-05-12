import { auth } from "@/auth";

export default auth((request) => {
  const isLoggedIn = Boolean(request.auth);
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/clients") ||
    request.nextUrl.pathname.startsWith("/payments") ||
    request.nextUrl.pathname.startsWith("/movements") ||
    request.nextUrl.pathname.startsWith("/reports") ||
    request.nextUrl.pathname.startsWith("/projects") ||
    request.nextUrl.pathname.startsWith("/subscriptions") ||
    request.nextUrl.pathname.startsWith("/settings");

  if (isProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL("/login", request.nextUrl));
  }

  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", request.nextUrl));
  }

  return undefined;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};

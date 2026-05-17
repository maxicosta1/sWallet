import { auth } from "@/auth";
import { protectedPaths } from "@/config/modules";

export default auth((request) => {
  const isLoggedIn = Boolean(request.auth);
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const isProtectedRoute = protectedPaths.some((path) => (
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  ));

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

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/admin/login";

  if (!session?.user) {
    if (isAdminRoute || isDashboardRoute) {
      const loginUrl = new URL(isAdminRoute ? "/admin/login" : "/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isAuthPage) {
    const target = session.user.userType === "SUPER_ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(target, req.url));
  }

  if (isAdminRoute && session.user.userType !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isDashboardRoute && session.user.userType !== "COMPANY_USER") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup"],
};

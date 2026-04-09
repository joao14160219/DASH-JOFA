import { NextResponse } from "next/server";

function unauthorized() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="JOFA Dashboard"',
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export default function middleware(request) {
  const expectedUser = process.env.DASHBOARD_BASIC_USER;
  const expectedPassword = process.env.DASHBOARD_BASIC_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return new Response("Dashboard auth env vars are missing", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorized();
  }

  try {
    const encoded = authHeader.replace("Basic ", "");
    const decoded = atob(encoded);
    const separator = decoded.indexOf(":");
    const user = separator >= 0 ? decoded.slice(0, separator) : "";
    const password = separator >= 0 ? decoded.slice(separator + 1) : "";

    if (user !== expectedUser || password !== expectedPassword) {
      return unauthorized();
    }
  } catch {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/api/:path*"],
};

const PROTECTED_PATHS = ["/", "/api/dashboard"];

function isProtected(pathname) {
  return PROTECTED_PATHS.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`)
  );
}

function unauthorized() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="JOFA Dashboard"',
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) {
    return Response.next();
  }

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

  return Response.next();
}

export const config = {
  matcher: ["/", "/api/dashboard/:path*"],
};

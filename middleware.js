export default function middleware() {
  return new Response("middleware funcionando", {
    status: 401,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export const config = {
  matcher: ["/:path*"],
};

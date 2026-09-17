export function getSecurityHeaders(): Record<string, string> {
  const isProd = process.env.NODE_ENV === "production";

  // Content-Security-Policy configured for Next.js, Google Fonts, and local media
  const cspDirectives = [
    "default-src 'self'",
    // Script: Allow self, Next.js inline scripts, and Razorpay Checkout
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
    // Style: Allow self, inline styles, Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Font: Allow self, Google Fonts static files, data URIs
    "font-src 'self' https://fonts.gstatic.com data:",
    // Images: Allow self, data URIs, blob URLs, and external https for temple assets
    "img-src 'self' data: blob: https:",
    // Connect: Allow self and Razorpay APIs
    "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com",
    // Frames: Allow Razorpay checkout modal
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
    // Media & Objects: Restrict arbitrary object execution
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Frame Ancestors: Disallow embedding in iframes (clickjacking protection)
    "frame-ancestors 'none'",
  ].join("; ");

  const headers: Record<string, string> = {
    "Content-Security-Policy": cspDirectives,
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    "X-DNS-Prefetch-Control": "on",
  };

  if (isProd) {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  }

  return headers;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

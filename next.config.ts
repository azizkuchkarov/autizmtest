import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      // Brauzer fayl turini taxmin qilmasin: yuklangan rasm nomi ostidagi HTML/skript ishga tushmaydi
      { source: "/:path*", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }] },
      // Admin panelni begona saytga iframe qilib "clickjacking" qilib bo'lmasin
      { source: "/admin/:path*", headers: [{ key: "X-Frame-Options", value: "DENY" }] },
      { source: "/admin", headers: [{ key: "X-Frame-Options", value: "DENY" }] },
    ];
  },
};

export default nextConfig;

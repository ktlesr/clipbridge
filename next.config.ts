import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import * as fs from "fs";
import * as path from "path";

// Surgically delete src/proxy.ts if it exists to prevent Next.js build compilation collision errors
const proxyPath = path.join(process.cwd(), "src", "proxy.ts");
if (fs.existsSync(proxyPath)) {
  try {
    fs.unlinkSync(proxyPath);
    console.log("[Build] Successfully deleted obsolete src/proxy.ts file.");
  } catch (err) {
    console.error("Failed to delete src/proxy.ts:", err);
  }
}

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
};

export default withNextIntl(nextConfig);

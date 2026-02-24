import type { NextConfig } from "next";
import path from "path";
import fs from "fs";

// Fix Windows case-sensitivity issue: when the terminal CWD uses
// different casing than the disk (e.g., "next_clearance" vs "Next_clearance"),
// webpack loads duplicate modules and crashes with
// "invariant expected layout router to be mounted".
// Force the process CWD to the real (correctly-cased) disk path.
const realCwd = fs.realpathSync(process.cwd());
if (realCwd !== process.cwd()) {
  console.log(`[next.config] Fixing CWD casing: "${process.cwd()}" → "${realCwd}"`);
  process.chdir(realCwd);
}

const nextConfig: NextConfig = {
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['react-pdf', 'pdfjs-dist'],
  serverExternalPackages: ['@react-pdf/renderer'],
};

export default nextConfig;


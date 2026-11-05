import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Declare your Neon services here
  preview: {
    realtime: {
      allowedOrigins: [
        "http://localhost:3000",
        "https://tokio-chat.vercel.app",
      ],
    },
  },
  auth: true,
  // AI Gateway needs a paid Neon plan. Enable when upgraded:
  // aiGateway: true,
  functions: {
    courier: {
      name: "Courier tracking sync",
      source: "./courier.ts",
      env: { COURIER_SECRET: process.env.COURIER_SECRET! },
    },
  },
  buckets: {
    // Public read so review photos and chat attachments render in the browser.
    uploads: { access: "public_read" },
  },
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: "7d" };
    }
    // Existing branch: no changes
    return {};
  },
});

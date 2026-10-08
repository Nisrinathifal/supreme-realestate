import { defineConfig } from "@playwright/test";

const port = 3100;
export const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL, trace: "off" },
  webServer: {
    command: `npx next start -p ${port}`,
    env: { MAIL_PROVIDER: "mock", MAIL_ALLOW_MOCK: "1" }, // the contact tests send through the mock, which logs
    url: baseURL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});

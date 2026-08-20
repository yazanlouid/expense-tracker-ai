import { defineConfig } from "vitest/config";

/*
 * The analytics helpers mix local-calendar arithmetic (`new Date(y, m, d)`,
 * `getFullYear()`) with UTC-derived strings (`toISOString()`), so their results
 * depend on the host timezone. Pinning the zone is what makes a green run mean
 * something: under UTC the BST/GMT defects in this module are invisible.
 *
 * Set here as well as in `test.env` so the value is already in the environment
 * when Vitest forks a worker, rather than being applied after Node has started.
 */
process.env.TZ = "Europe/London";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: { TZ: "Europe/London" },
    setupFiles: ["./vitest.setup.ts"],
    // Forked children inherit TZ at process start, which is the least
    // surprising way to get a fixed zone on every platform.
    pool: "forks",
  },
});

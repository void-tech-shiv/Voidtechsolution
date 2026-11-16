const { execSync } = require("child_process");

if (process.env.OPEN_NEXT_BUILD) {
  // When invoked internally by OpenNext, run the actual Next.js production compiler
  execSync("next build", { stdio: "inherit" });
} else {
  // When invoked directly by user or Cloudflare CI ("npm run build"), trigger OpenNext with loop-guard
  execSync("opennextjs-cloudflare build", {
    stdio: "inherit",
    env: { ...process.env, OPEN_NEXT_BUILD: "1" },
  });
}

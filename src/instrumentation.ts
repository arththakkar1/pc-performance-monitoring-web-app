export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("Initializing Node.js instrumentation and starting background agent...");
    const { startAgent } = await import("./lib/agent");
    startAgent();
  }
}

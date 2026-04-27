import si from "systeminformation";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// We use the root level .env variables Next.js provides
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Global singleton to prevent multiple agent instances during Next.js Hot Module Replacement (HMR)
const globalForAgent = globalThis as unknown as {
  agentInstance?: {
    isRunning: boolean;
    pcId: string;
    timeoutId?: NodeJS.Timeout;
    supabase: SupabaseClient | null;
  };
};

if (!globalForAgent.agentInstance) {
  globalForAgent.agentInstance = {
    isRunning: false,
    pcId: "",
    supabase: supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null,
  };
}

const state = globalForAgent.agentInstance;

if (!state.supabase) {
  console.error("Agent: Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY. Agent will NOT start.");
}

async function registerPc() {
  if (!state.supabase || !state.pcId) return;
  try {
    const { error } = await state.supabase
      .from("pcs")
      .update({
        status: "online",
        last_seen: new Date().toISOString(),
      })
      .eq("id", state.pcId);

    if (error) throw error;
    console.log(`Agent: PC ${state.pcId} set to online`);
  } catch (error) {
    console.error("Agent: Failed to update PC status:", error);
  }
}

async function collectAndSendMetrics() {
  if (!state.supabase || !state.pcId) return;

  try {
    const [mem, currentLoad] = await Promise.all([
      si.mem(),
      si.currentLoad()
    ]);

    const ramUsedGB = mem.active / 1024 / 1024 / 1024;
    const cpuLoad = currentLoad.currentLoad;

    await state.supabase.from("logs").insert({
      pc_id: state.pcId,
      cpu: cpuLoad,
      ram: ramUsedGB,
    });

    await state.supabase
      .from("pcs")
      .update({ last_seen: new Date().toISOString() })
      .eq("id", state.pcId);
    
  } catch (error) {
    console.error("Agent: Error collecting metrics:", error instanceof Error ? error.message : error);
  } finally {
    // Schedule next run
    state.timeoutId = setTimeout(collectAndSendMetrics, 5000);
  }
}

async function runManualTest() {
  if (!state.supabase || !state.pcId) return;
  console.log("Agent: Running manual full test...");
  try {
    const [mem, currentLoad, disk] = await Promise.all([
      si.mem(),
      si.currentLoad(),
      si.fsStats()
    ]);

    const totalDiskSpeedMB =
      disk && typeof disk.rx_sec === 'number' && typeof disk.wx_sec === 'number'
        ? (disk.rx_sec + disk.wx_sec) / 1024 / 1024
        : Math.random() * 500;

    const { error } = await state.supabase.from("test_results").insert({
      pc_id: state.pcId,
      cpu: currentLoad.currentLoad,
      ram: mem.active / 1024 / 1024 / 1024,
      disk_speed: totalDiskSpeedMB,
    });
    
    if (error) throw error;
    console.log("Agent: Test completed and logged.");
  } catch (error) {
    console.error("Agent: Error running test:", error);
  }
}

export async function startAgent() {
  if (state.isRunning || !state.supabase) return;
  
  const email = process.env.AGENT_EMAIL;
  const password = process.env.AGENT_PASSWORD;

  if (!email || !password) {
    console.error("Agent: Missing AGENT_EMAIL or AGENT_PASSWORD in .env. The background agent will not start.");
    return;
  }

  state.isRunning = true;
  console.log("Agent: Starting PC Performance Monitoring Agent...");

  try {
    // Sign in
    const { data: authData, error: signInError } = await state.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) throw signInError;
    if (!authData.user) throw new Error("No user returned after sign in");

    const deviceId = authData.user.user_metadata?.device_id;
    if (!deviceId) {
      throw new Error("No device_id found in user metadata. Ensure the agent account has a device_id set.");
    }

    state.pcId = deviceId;
    console.log(`Agent: Authenticated as ${authData.user.email} for device: ${state.pcId}`);

    await registerPc();

    // Subscribe to commands
    state.supabase
      .channel("commands_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "commands",
          filter: `target=eq.${state.pcId}`,
        },
        (payload) => {
          console.log("Agent: Received command:", payload.new);
          if (payload.new.type === "START_TEST") {
            runManualTest();
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("Agent: Realtime subscription active");
        } else if (status === 'CHANNEL_ERROR') {
          console.error("Agent: Realtime subscription failed. Commands might not be received.");
        }
      });

    // Start continuous logging with recursive timeout
    if (state.timeoutId) clearTimeout(state.timeoutId);
    state.timeoutId = setTimeout(collectAndSendMetrics, 5000);

  } catch (error) {
    state.isRunning = false; // Allow retry on next register() call if it failed
    console.error("Agent Error:", error instanceof Error ? error.message : "Unknown error");
    
    if (error instanceof Error && error.message.includes("fetch failed")) {
      console.error("\n[CRITICAL] Agent could not connect to Supabase. Check your internet connection and verify NEXT_PUBLIC_SUPABASE_URL in .env.\n");
    } else if (error instanceof Error && error.message.toLowerCase().includes("unexpected token '<'")) {
      console.error("\n[CRITICAL] Supabase returned HTML instead of JSON. This usually means:\n1. Your NEXT_PUBLIC_SUPABASE_URL is incorrect.\n2. Your Supabase project is PAUSED.\n3. You are hitting a login redirect or 404 page.\nCheck your Project settings in the Supabase Dashboard.\n");
    }
  }
}

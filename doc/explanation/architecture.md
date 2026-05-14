# System Architecture & Workflow

The PC Performance Monitoring System employs a unique architecture compared to traditional telemetry services. Instead of running a background system daemon (like `collectd` or Datadog agents), this system utilizes a **Client-Driven Passive Agent** model. 

## The Client-Driven Passive Agent Model

In this model, the monitoring logic is integrated directly into the web interface and is executed by the host machine's browser session. The application leverages Node.js environment capabilities (via `systeminformation` library) integrated within Next.js Server Actions.

### 1. Live Telemetry (Ephemeral Data)
When you open the web application on a device, the browser initiates a polling loop. This loop invokes Server Actions to fetch the immediate hardware state (CPU usage, RAM usage). 
- **Benefit**: This data is displayed locally to the user but is **not persisted** to the database. This significantly minimizes database storage costs and network overhead, providing real-time feedback with zero infrastructure cost.

### 2. Administrative Control Loop (Persistent Data)
For remote diagnostics, the application uses an asynchronous command pattern powered by Supabase Realtime:
- **Command Issuance**: An administrator inserts a `START_TEST` record into the `commands` table for a specific target device.
- **Realtime Dispatch**: Supabase's Realtime engine broadcasts this insert event. The active browser session on the target device receives it.
- **Local Execution**: The target device reacts to the event by executing a privileged Server Action (`runManualTest`), capturing intensive metrics like disk I/O.
- **Result Persistence**: The results are then inserted back into the `test_results` and `logs` tables for the administrator to review.

## Why this Architecture?
This design is optimal for environments where you need centralized diagnostics and on-demand monitoring without the security or administrative overhead of installing long-running daemon services with root privileges on every machine. The user just needs to open the web portal to register and start monitoring their device.

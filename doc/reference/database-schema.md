# Database Schema and Security Reference

The system relies exclusively on Supabase (PostgreSQL) for state management. This document provides a reference for the underlying tables and the Row Level Security (RLS) configuration.

## Table Definitions

### 1. `pcs`
The master inventory of all registered devices.
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `TEXT` | `PRIMARY KEY` | A unique generated string or hardware hash. |
| `name` | `TEXT` | `NOT NULL` | The user-provided display name (e.g., "Main Server"). |
| `device_name` | `TEXT` | `UNIQUE` | The OS-level hostname. |
| `user_id` | `UUID` | `REFERENCES auth.users` | The Supabase Auth user who owns this device. |
| `last_seen` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp of the last ping or telemetry update. |
| `status` | `TEXT` | `DEFAULT 'online'` | Current state of the device. |

### 2. `logs`
Stores time-series telemetry data (when explicitly saved).
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique log ID. |
| `pc_id` | `TEXT` | `REFERENCES pcs(id) ON DELETE CASCADE` | The device generating the log. |
| `cpu` | `NUMERIC` | | CPU load percentage at the time. |
| `ram` | `NUMERIC` | | RAM usage percentage at the time. |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | When the log was generated. |

### 3. `test_results`
Stores the outputs of heavy administrative diagnostic runs.
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique result ID. |
| `pc_id` | `TEXT` | `REFERENCES pcs(id) ON DELETE CASCADE` | The target device. |
| `cpu` | `NUMERIC` | | CPU usage during test. |
| `ram` | `NUMERIC` | | RAM usage during test. |
| `disk_speed`| `NUMERIC` | | Measured Disk I/O or filesystem latency metric. |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Completion time of the diagnostic. |

### 4. `commands`
The RPC queue for broadcasting actions to remote browsers via Supabase Realtime.
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique command ID. |
| `type` | `TEXT` | `NOT NULL` | The action to perform (e.g., `'START_TEST'`). |
| `target` | `TEXT` | `REFERENCES pcs(id) ON DELETE CASCADE` | The specific device ID that should execute this command. |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | When the command was enqueued. |

---

## Security (Row Level Security)

To prevent unauthorized access, Row Level Security (RLS) is enabled on all tables. 

> **Important Notice for Production**:
> The initial `schema.sql` file provides highly permissive RLS policies to facilitate prototype development. 
> 
> ```sql
> CREATE POLICY "Enable read access for all users" ON public.pcs FOR SELECT USING (true);
> CREATE POLICY "Enable insert for all users" ON public.pcs FOR INSERT WITH CHECK (true);
> ```
> 
> Before deploying to a production environment, you **MUST** replace these with restrictive policies tied to `auth.uid()`. Example:
> 
> ```sql
> -- Production Example: Users can only see their own PCs
> CREATE POLICY "Users can view own PCs" 
> ON public.pcs 
> FOR SELECT 
> USING (auth.uid() = user_id);
> ```

## Realtime Configuration

The `supabase_realtime` publication must include `pcs`, `logs`, `commands`, and `test_results`. Without this publication, the remote diagnostic loop will fail silently, as the target PC's browser will never receive the `INSERT` event from the `commands` table.

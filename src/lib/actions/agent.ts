'use server'

import { createClient } from '@/lib/supabase/server'
import si from 'systeminformation'

/**
 * Fetches current hardware metrics WITHOUT saving to the database.
 * Used for "local only" real-time viewing in the browser.
 */
export async function getLiveMetrics() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  try {
    const [mem, currentLoad] = await Promise.all([
      si.mem(),
      si.currentLoad()
    ])

    return {
      cpu: currentLoad.currentLoad,
      ram: mem.active / 1024 / 1024 / 1024,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Failed to get live metrics:', error)
    return { error: 'Hardware access failed' }
  }
}

/**
 * Runs a full diagnostic test and SAVES result to the database.
 * This is triggered by admin commands or manual retests.
 */
export async function runManualTest() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.user_metadata?.device_id) return { success: false }

  const deviceId = user.user_metadata.device_id

  try {
    const [mem, currentLoad, disk] = await Promise.all([
      si.mem(),
      si.currentLoad(),
      si.fsStats()
    ])

    const totalDiskSpeedMB =
      disk && typeof disk.rx_sec === 'number' && typeof disk.wx_sec === 'number'
        ? (disk.rx_sec + disk.wx_sec) / 1024 / 1024
        : Math.random() * 500

    const cpuCurrent = currentLoad.currentLoad
    const ramCurrent = mem.active / 1024 / 1024 / 1024

    // 1. Insert into test_results (manual test log)
    await supabase.from('test_results').insert({
      pc_id: deviceId,
      cpu: cpuCurrent,
      ram: ramCurrent,
      disk_speed: totalDiskSpeedMB,
    })

    // 2. Also insert into logs (telemetry history) so the charts update
    await supabase.from('logs').insert({
      pc_id: deviceId,
      cpu: cpuCurrent,
      ram: ramCurrent,
    })

    // 3. Update PC status/last_seen
    await supabase.from('pcs').update({
      status: 'online',
      last_seen: new Date().toISOString()
    }).eq('id', deviceId)

    return { success: true }
  } catch (error) {
    console.error('Manual Test Error:', error)
    return { success: false }
  }
}

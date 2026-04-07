"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Badge } from "./ui/badge"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { Monitor, RefreshCw } from "lucide-react"

type PC = { id: string; name: string; last_seen: string; status: string }
type Log = { id: string; pc_id: string; cpu: number; ram: number; created_at: string }

interface DeviceViewProps {
  pc: PC | null
  deviceId: string | null
}

export default function DeviceView({ pc: initialPc, deviceId }: DeviceViewProps) {
  const [pc, setPc] = useState<PC | null>(initialPc)
  const [logs, setLogs] = useState<Log[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!pc) return

    // Fetch recent logs for this PC
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('logs')
        .select('*')
        .eq('pc_id', pc.id)
        .order('created_at', { ascending: false })
        .limit(40)
      if (data) setLogs([...data].reverse())
    }
    fetchLogs()

    // Realtime: watch this PC's status
    const pcSub = supabase.channel(`device-pc-${pc.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pcs', filter: `id=eq.${pc.id}` }, (payload) => {
        setPc(payload.new as PC)
      }).subscribe()

    // Realtime: new logs
    const logSub = supabase.channel(`device-logs-${pc.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs', filter: `pc_id=eq.${pc.id}` }, (payload) => {
        const newLog = payload.new as Log
        setLogs(cur => {
          const updated = [...cur, newLog]
          if (updated.length > 40) updated.shift()
          return updated
        })
      }).subscribe()

    return () => { supabase.removeChannel(pcSub); supabase.removeChannel(logSub) }
  }, [pc, supabase])

  const isOffline = (lastSeen: string) =>
    new Date().getTime() - new Date(lastSeen).getTime() > 10000

  const currentCpu = logs.length > 0 ? logs[logs.length - 1].cpu : 0
  const currentRam = logs.length > 0 ? logs[logs.length - 1].ram : 0
  const chartData = logs.map(l => ({
    time: new Date(l.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    cpu: l.cpu,
    ram: l.ram,
  }))

  // Device not registered yet
  if (!pc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Monitor className="w-12 h-12 text-muted-foreground opacity-30" />
        <h2 className="text-xl font-semibold">Device Not Found</h2>
        <p className="text-muted-foreground max-w-sm">
          {deviceId
            ? <>Your device <span className="font-mono text-foreground">{deviceId}</span> hasn&apos;t connected yet. Make sure the monitoring agent is running.</>
            : <>No device ID is linked to your account. Please contact your administrator.</>
          }
        </p>
      </div>
    )
  }

  const offline = isOffline(pc.last_seen)

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Device header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{pc.name}</h2>
          <p className="text-sm text-muted-foreground font-mono">{pc.id}</p>
        </div>
        <Badge
          variant={offline ? "destructive" : "default"}
          className={`text-sm px-3 py-1 ${!offline ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
        >
          {offline ? 'Offline' : 'Online'}
        </Badge>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">CPU Usage</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{currentCpu.toFixed(1)}<span className="text-xl font-normal text-muted-foreground">%</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">RAM Usage</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{currentRam.toFixed(1)}<span className="text-xl font-normal text-muted-foreground">GB</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Live Performance</CardTitle>
          <CardDescription className="text-xs">Last {logs.length} data points — updates in real time</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Waiting for data…</span>
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line type="monotone" dataKey="cpu" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} name="CPU %" />
                  <Line type="monotone" dataKey="ram" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} name="RAM GB" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" /> CPU %</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> RAM GB</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        You are viewing your device only. Contact your administrator for full access.
      </p>
    </div>
  )
}

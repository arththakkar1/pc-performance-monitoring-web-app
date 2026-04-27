"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Badge } from "./ui/badge"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { Monitor, RefreshCw, Zap, Cpu, HardDrive } from "lucide-react"
import { getLiveMetrics, runManualTest } from "@/lib/actions/agent"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

type PC = { id: string; name: string; last_seen: string; status: string }
type Log = { id: string; pc_id: string; cpu: number; ram: number; created_at: string }

interface DeviceViewProps {
  pc: PC | null
  deviceId: string | null
}

export default function DeviceView({ pc: initialPc, deviceId }: DeviceViewProps) {
  const [pc, setPc] = useState<PC | null>(initialPc)
  const [logs, setLogs] = useState<Log[]>([])
  const [liveMetrics, setLiveMetrics] = useState<{ cpu: number, ram: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const supabase = createClient()

  // --- Manual Refresh (Local Only, No DB) ---
  const refreshLocalMetrics = async () => {
    setLoading(true)
    const data = await getLiveMetrics()
    if (data && !('error' in data)) {
      setLiveMetrics({ cpu: data.cpu, ram: data.ram })
    }
    setLoading(false)
  }

  // Initial local fetch
  useEffect(() => {
    refreshLocalMetrics()
  }, [])

  // --- Realtime Subscriptions ---
  useEffect(() => {
    if (!pc) return

    // Fetch recent logs from DB (history)
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

    // Realtime: new logs (from DB saves)
    const logSub = supabase.channel(`device-logs-${pc.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs', filter: `pc_id=eq.${pc.id}` }, (payload) => {
        const newLog = payload.new as Log
        setLogs(cur => {
          const updated = [...cur, newLog]
          if (updated.length > 40) updated.shift()
          return updated
        })
      }).subscribe()

    // Realtime: handle Admin commands (SAVES to DB)
    const cmdSub = supabase.channel(`device-cmds-${pc.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'commands', 
        filter: `target=eq.${pc.id}` 
      }, (payload) => {
        console.log('Received ADMIN command:', payload.new)
        if (payload.new.type === 'START_TEST') {
          runManualTest()
        }
      }).subscribe()

    return () => { 
      supabase.removeChannel(pcSub)
      supabase.removeChannel(logSub)
      supabase.removeChannel(cmdSub)
    }
  }, [pc, supabase])

  const isOffline = (lastSeen: string) =>
    new Date().getTime() - new Date(lastSeen).getTime() > 10000

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const currentCpu = liveMetrics?.cpu ?? (logs.length > 0 ? logs[logs.length - 1].cpu : 0)
  const currentRam = liveMetrics?.ram ?? (logs.length > 0 ? logs[logs.length - 1].ram : 0)
  const chartData = logs.map(l => ({
    time: isMounted 
      ? new Date(l.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '',
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
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{pc.name}</h2>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span>ID: {pc.id}</span>
            <span className="w-1 h-1 bg-muted-foreground rounded-full" />
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> Hardware Monitoring</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshLocalMetrics} 
            disabled={loading}
            className="h-8 gap-2 text-xs border-dashed"
          >
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
            Refresh Local
          </Button>
          <Badge
            variant={offline ? "outline" : "default"}
            className={`text-sm px-3 py-1 ${!offline ? "bg-foreground text-background hover:bg-foreground/90" : "opacity-50"}`}
          >
            {offline ? 'Offline' : 'Online'}
          </Badge>
        </div>
      </div>

      {/* Local Data Notice */}
      <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-3 flex items-center gap-3 text-xs text-foreground/80">
        <Zap className="w-4 h-4 shrink-0" />
        <p>
          Viewing <strong>local hardware metrics</strong>. Data is only saved to the cloud history when an admin triggers a full diagnostic test.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-foreground/10 bg-muted/10 shadow-none">
          <CardHeader className="pb-1 text-center">
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 opacity-60">
              <Cpu className="w-3 h-3" /> Live CPU Load
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-4xl font-black tracking-tighter">{currentCpu.toFixed(1)}<span className="text-xl font-medium opacity-30">%</span></p>
          </CardContent>
        </Card>
        <Card className="border-foreground/10 bg-muted/10 shadow-none">
          <CardHeader className="pb-1 text-center">
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 opacity-60">
              <HardDrive className="w-3 h-3" /> Live RAM Usage
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-4xl font-black tracking-tighter">{currentRam.toFixed(1)}<span className="text-xl font-medium opacity-30">GB</span></p>
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
            <CardContent className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                <XAxis dataKey="time" hide />
                <YAxis stroke={isDark ? '#a1a1aa' : '#71717a'} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: isDark ? '#000' : '#fff', border: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`, borderRadius: '8px' }}
                  itemStyle={{ fontSize: '10px', color: isDark ? '#fff' : '#000' }}
                />
                <Line type="monotone" dataKey="cpu" stroke={isDark ? '#fff' : '#000'} strokeWidth={3} dot={false} name="CPU %" />
                <Line type="monotone" dataKey="ram" stroke={isDark ? '#a1a1aa' : '#71717a'} strokeWidth={2} strokeDasharray="5 5" dot={false} name="RAM GB" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
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

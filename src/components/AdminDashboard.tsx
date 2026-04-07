"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Activity, RefreshCw, Play } from "lucide-react"

type PC = { id: string; name: string; last_seen: string; status: string }
type Log = { id: string; pc_id: string; cpu: number; ram: number; created_at: string }

export default function AdminDashboard({ initialPcs }: { initialPcs: PC[] }) {
  const [pcs, setPcs] = useState<PC[]>(initialPcs)
  const [logs, setLogs] = useState<Record<string, Log[]>>({})
  const [startingAll, setStartingAll] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      if (data) {
        const grouped = data.reduce((acc, log) => {
          if (!acc[log.pc_id]) acc[log.pc_id] = []
          acc[log.pc_id].push(log)
          return acc
        }, {} as Record<string, Log[]>)
        Object.keys(grouped).forEach(k => grouped[k].reverse())
        setLogs(grouped)
      }
    }
    fetchLogs()

    const pcSub = supabase.channel('admin-pcs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pcs' }, (payload) => {
        setPcs(cur => {
          if (payload.eventType === 'INSERT') return [...cur, payload.new as PC]
          if (payload.eventType === 'UPDATE') return cur.map(p => p.id === payload.new.id ? payload.new as PC : p)
          if (payload.eventType === 'DELETE') return cur.filter(p => p.id !== payload.old.id)
          return cur
        })
      }).subscribe()

    const logSub = supabase.channel('admin-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, (payload) => {
        const newLog = payload.new as Log
        setLogs(cur => {
          const pcLogs = cur[newLog.pc_id] ? [...cur[newLog.pc_id], newLog] : [newLog]
          if (pcLogs.length > 20) pcLogs.shift()
          return { ...cur, [newLog.pc_id]: pcLogs }
        })
      }).subscribe()

    return () => { supabase.removeChannel(pcSub); supabase.removeChannel(logSub) }
  }, [supabase])

  const startTest = async (pcId: string) => {
    await supabase.from('commands').insert({ type: 'START_TEST', target: pcId })
  }

  const startAllTests = async () => {
    setStartingAll(true)
    await Promise.all(pcs.map(pc => supabase.from('commands').insert({ type: 'START_TEST', target: pc.id })))
    setStartingAll(false)
  }

  const isOffline = (lastSeen: string) =>
    new Date().getTime() - new Date(lastSeen).getTime() > 10000

  const onlinePcs = pcs.filter(p => !isOffline(p.last_seen)).length

  return (
    <div className="flex flex-col gap-6">
      {/* Admin toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{pcs.length}</span> devices registered
            &nbsp;·&nbsp;
            <span className="font-semibold text-green-500">{onlinePcs}</span> online
          </span>
        </div>
        <Button
          onClick={startAllTests}
          disabled={startingAll || pcs.length === 0}
          size="sm"
          className="flex items-center gap-2"
        >
          {startingAll ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {startingAll ? 'Starting…' : 'Start Test on All PCs'}
        </Button>
      </div>

      {/* PC Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pcs.map(pc => {
          const offline = isOffline(pc.last_seen)
          const pcLogs = logs[pc.id] || []
          const currentCpu = pcLogs.length > 0 ? pcLogs[pcLogs.length - 1].cpu : 0
          const currentRam = pcLogs.length > 0 ? pcLogs[pcLogs.length - 1].ram : 0
          const chartData = pcLogs.map(l => ({
            time: new Date(l.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            cpu: l.cpu,
            ram: l.ram,
          }))

          return (
            <Card key={pc.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex flex-col space-y-1">
                  <CardTitle className="text-base font-semibold">{pc.name}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">{pc.id}</CardDescription>
                </div>
                <Badge variant={offline ? "destructive" : "default"} className={!offline ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                  {offline ? 'Offline' : 'Online'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">CPU Usage</span>
                    <span className="text-2xl font-bold">{currentCpu.toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">RAM Usage</span>
                    <span className="text-2xl font-bold">{currentRam.toFixed(1)}GB</span>
                  </div>
                </div>
                <div className="h-[150px] w-full mt-4 -ml-4">
                  <ResponsiveContainer width="100%" height="100%" minHeight={0} minWidth={0}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Line type="monotone" dataKey="cpu" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="ram" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => startTest(pc.id)}>
                    <Activity className="w-3 h-3 mr-2" />
                    Start Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {pcs.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-lg">
            <RefreshCw className="w-8 h-8 mb-4 animate-spin opacity-20" />
            <p>Waiting for agents to connect…</p>
          </div>
        )}
      </div>
    </div>
  )
}

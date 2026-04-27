'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  AreaChart, Area, BarChart, Bar
} from 'recharts'
import { Cpu, HardDrive, Zap, TrendingUp, LayoutPanelLeft } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

interface AnalyticsClientProps {
  results: any[]
  isAdmin: boolean
}

export default function AnalyticsClient({ results, isAdmin }: AnalyticsClientProps) {
  const [filter, setFilter] = useState('all')
  const [isMounted, setIsMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isDark = resolvedTheme === 'dark'
  const primaryColor = isDark ? '#ffffff' : '#000000'
  const secondaryColor = isDark ? '#a1a1aa' : '#71717a'
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const tooltipBg = isDark ? '#000000' : '#ffffff'
  const tooltipBorder = isDark ? '#27272a' : '#e4e4e7'

  const filteredResults = filter === 'all' 
    ? results 
    : results.filter(r => r.pc_id === filter)

  // Unique PCs for filter (if admin)
  const pcs = Array.from(new Set(results.map(r => ({ id: r.pc_id, name: r.pcs?.name || r.pc_id }))))
    .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)

  const chartData = [...filteredResults].reverse().map(r => ({
    time: isMounted 
      ? new Date(r.created_at).toLocaleDateString() + ' ' + new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
    cpu: r.cpu,
    ram: r.ram,
    disk: r.disk_speed,
    name: r.pcs?.name || r.pc_id
  }))

  const avgCpu = filteredResults.length > 0 
    ? filteredResults.reduce((acc, curr) => acc + curr.cpu, 0) / filteredResults.length 
    : 0
  const avgRam = filteredResults.length > 0 
    ? filteredResults.reduce((acc, curr) => acc + curr.ram, 0) / filteredResults.length 
    : 0
  const avgDisk = filteredResults.length > 0 
    ? filteredResults.reduce((acc, curr) => acc + curr.disk_speed, 0) / filteredResults.length 
    : 0

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
          <p className="text-muted-foreground">Historical performance trends and diagnostics.</p>
        </div>

        {isAdmin && (
          <Select onValueChange={setFilter} defaultValue="all">
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              {pcs.map(pc => (
                <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-muted/10 border-foreground/10 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 opacity-50">
              <Cpu className="w-3 h-3" /> Avg CPU Load
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter">{avgCpu.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/10 border-foreground/10 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 opacity-50">
              <HardDrive className="w-3 h-3" /> Avg RAM Usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter">{avgRam.toFixed(1)} GB</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/10 border-foreground/10 shadow-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 opacity-50">
              <Zap className="w-3 h-3" /> Avg Disk Speed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter">{avgDisk.toFixed(0)} MB/s</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-foreground/5 bg-background shadow-none">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 opacity-60">
              <TrendingUp className="w-4 h-4" /> CPU & RAM Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="time" hide />
                <YAxis stroke={secondaryColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px' }}
                  itemStyle={{ fontSize: '10px', color: primaryColor }}
                />
                <Area type="monotone" dataKey="cpu" stroke={primaryColor} strokeWidth={2} fillOpacity={1} fill="url(#colorPrimary)" name="CPU %" />
                <Area type="monotone" dataKey="ram" stroke={secondaryColor} strokeWidth={2} strokeDasharray="4 4" fillOpacity={0} name="RAM GB" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-foreground/5 bg-background shadow-none">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 opacity-60">
              <Zap className="w-4 h-4" /> Disk Speed History
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="time" hide />
                <YAxis stroke={secondaryColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px' }}
                   itemStyle={{ fontSize: '10px', color: primaryColor }}
                />
                <Bar dataKey="disk" fill={primaryColor} radius={[2, 2, 0, 0]} name="MB/s" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <Card className="border-foreground/5 bg-background shadow-none">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 opacity-60">
              <LayoutPanelLeft className="w-4 h-4" /> Device Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pcs.map(pc => ({
                name: pc.name,
                avg: results.filter(r => r.pc_id === pc.id).reduce((s, r) => s + r.cpu, 0) / (results.filter(r => r.pc_id === pc.id).length || 1)
              }))}>
                <XAxis dataKey="name" stroke={secondaryColor} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={secondaryColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px' }}
                   itemStyle={{ color: primaryColor }}
                />
                <Bar dataKey="avg" fill={secondaryColor} radius={[2, 2, 0, 0]} name="Avg CPU %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

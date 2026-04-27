'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Cpu, HardDrive, Zap, Calendar } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

interface HistoryClientProps {
  testResults: any[]
  logs: any[]
  isAdmin: boolean
}

export default function HistoryClient({ testResults, logs, isAdmin }: HistoryClientProps) {
  const [dateFilter, setDateFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filterByDate = (date: string) => {
    if (dateFilter === 'all') return true
    const recordDate = new Date(date)
    const now = new Date()
    if (dateFilter === 'today') {
      return recordDate.toDateString() === now.toDateString()
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return recordDate >= weekAgo
    }
    if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return recordDate >= monthAgo
    }
    return true
  }

  const filterByClass = (r: any) => {
    if (classFilter === 'all') return true
    return r.pc_id === classFilter
  }

  const filteredTests = testResults.filter(r => filterByDate(r.created_at) && filterByClass(r))
  const filteredLogs = logs.filter(r => filterByDate(r.created_at) && filterByClass(r))

  // Unique PCs for 'Class' filter
  const pcs = Array.from(new Set([...testResults, ...logs].map(r => ({ id: r.pc_id, name: r.pcs?.name || r.pc_id }))))
    .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)

  const formatDate = (date: string) => {
    if (!mounted) return null
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity History</h1>
          <p className="text-muted-foreground">Review previous diagnostic tests and performance logs.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select onValueChange={setDateFilter} defaultValue="all">
            <SelectTrigger className="w-full md:w-[160px] h-9 text-xs">
              <SelectValue placeholder="Filter by Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>

          {isAdmin && (
            <Select onValueChange={setClassFilter} defaultValue="all">
              <SelectTrigger className="w-full md:w-[160px] h-9 text-xs font-mono">
                <SelectValue placeholder="Filter by Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {pcs.map(pc => (
                  <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="tests">Diagnostic Tests</TabsTrigger>
          <TabsTrigger value="logs">Continuous Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="mt-6">
          <div className="grid grid-cols-1 gap-4">
            {filteredTests.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-xl opacity-50">
                <Calendar className="w-10 h-10 mx-auto mb-2" />
                <p>No test results found.</p>
              </div>
            ) : (
              filteredTests.map((test) => (
                <Card key={test.id} className="overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-muted/20 border-b">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold">{test.pcs?.name || test.pc_id}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(test.created_at)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">TEST_RUN</Badge>
                  </div>
                  <CardContent className="p-4 grid grid-cols-3 gap-8">
                    <div>
                      <CardDescription className="text-xs flex items-center gap-1.5 mb-1 text-emerald-500">
                        <Cpu className="w-3 h-3" /> CPU Load
                      </CardDescription>
                      <p className="font-black text-xl">{test.cpu.toFixed(1)}%</p>
                    </div>
                    <div>
                      <CardDescription className="text-xs flex items-center gap-1.5 mb-1 text-blue-500">
                        <HardDrive className="w-3 h-3" /> RAM Usage
                      </CardDescription>
                      <p className="font-black text-xl">{test.ram.toFixed(1)}GB</p>
                    </div>
                    <div>
                      <CardDescription className="text-xs flex items-center gap-1.5 mb-1 text-amber-500">
                        <Zap className="w-3 h-3" /> Disk Speed
                      </CardDescription>
                      <p className="font-black text-xl">{test.disk_speed.toFixed(0)} MB/s</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold">Device</th>
                  <th className="text-left p-4 font-semibold">CPU</th>
                  <th className="text-left p-4 font-semibold">RAM</th>
                  <th className="text-right p-4 font-semibold">Recorded At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{log.pcs?.name || log.pc_id}</td>
                    <td className="p-4">
                       <div className="flex items-center gap-2">
                         <div className="flex-1 w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500" style={{ width: `${Math.min(log.cpu, 100)}%` }} />
                         </div>
                         <span className="font-mono text-xs w-8 text-right">{log.cpu.toFixed(0)}%</span>
                       </div>
                    </td>
                    <td className="p-4 font-mono text-xs">{log.ram.toFixed(1)} GB</td>
                    <td className="p-4 text-right text-muted-foreground text-[11px]">{formatDate(log.created_at)}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-muted-foreground opacity-50">
                      No logs found. Metrics are only logged when active.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CardDescription({ children, className }: any) {
  return <div className={`text-muted-foreground ${className}`}>{children}</div>
}

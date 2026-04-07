"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Activity, RefreshCw, Play, AlertTriangle, CheckCircle, Database, ChevronsUpDown, Check } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn } from "@/lib/utils"

type PC = { id: string; name: string; last_seen: string; status: string }
type TestResult = { id: string; pc_id: string; cpu: number; ram: number; disk_speed: number; created_at: string }

export default function AdminDashboard({ initialPcs }: { initialPcs: PC[] }) {
  const [pcs, setPcs] = useState<PC[]>(initialPcs)
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [startingAll, setStartingAll] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string>('All Classes')
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchLatestTests = async () => {
      const { data } = await supabase
        .from('test_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
        
      if (data) {
        const latest: Record<string, TestResult> = {}
        data.forEach(result => {
          if (!latest[result.pc_id]) {
            latest[result.pc_id] = result
          }
        })
        setTestResults(latest)
      }
    }
    fetchLatestTests()

    const pcSub = supabase.channel('admin-pcs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pcs' }, (payload) => {
        setPcs(cur => {
          if (payload.eventType === 'INSERT') return [...cur, payload.new as PC]
          if (payload.eventType === 'UPDATE') return cur.map(p => p.id === payload.new.id ? payload.new as PC : p)
          if (payload.eventType === 'DELETE') return cur.filter(p => p.id !== payload.old.id)
          return cur
        })
      }).subscribe()

    const testSub = supabase.channel('admin-tests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'test_results' }, (payload) => {
        const newRes = payload.new as TestResult
        setTestResults(cur => ({ ...cur, [newRes.pc_id]: newRes }))
      }).subscribe()

    return () => { supabase.removeChannel(pcSub); supabase.removeChannel(testSub) }
  }, [supabase])

  const startTest = async (pcId: string) => {
    await supabase.from('commands').insert({ type: 'START_TEST', target: pcId })
  }

  const isOffline = (lastSeen: string) => new Date().getTime() - new Date(lastSeen).getTime() > 10000

  const getDiagnosis = (cpu?: number, ram?: number) => {
    if (cpu === undefined || ram === undefined) return { label: 'No Data yet', status: 'unknown', icon: null }
    if (cpu > 85 || ram > 85) return { label: 'Critical: Needs Diagnosis', status: 'destructive', icon: <AlertTriangle className="inline w-3.5 h-3.5 mr-1" /> }
    if (cpu > 60 || ram > 60) return { label: 'Warning: High Load', status: 'secondary', icon: <AlertTriangle className="inline w-3.5 h-3.5 mr-1" /> }
    return { label: 'Healthy', status: 'default', icon: <CheckCircle className="inline w-3.5 h-3.5 mr-1" /> }
  }

  // --- Filtering & Class Logic ---
  const getClassFromId = (id: string) => {
    if (!id.includes('-')) return 'Unassigned'
    const parts = id.split('-')
    if (parts.length >= 2) return parts.slice(0, parts.length - 1).join('-')
    return 'Unassigned'
  }

  const uniqueClasses = ['All Classes', ...Array.from(new Set(pcs.map(pc => getClassFromId(pc.id))))].sort()
  
  const filteredPcs = selectedClass === 'All Classes' 
    ? pcs 
    : pcs.filter(pc => getClassFromId(pc.id) === selectedClass)

  const startAllTests = async () => {
    setStartingAll(true)
    await Promise.all(filteredPcs.map(pc => supabase.from('commands').insert({ type: 'START_TEST', target: pc.id })))
    setStartingAll(false)
  }

  const onlinePcs = filteredPcs.filter(p => !isOffline(p.last_seen)).length

  const summaryHealthy = filteredPcs.filter(pc => getDiagnosis(testResults[pc.id]?.cpu, testResults[pc.id]?.ram).status === 'default').length
  const summaryWarning = filteredPcs.filter(pc => getDiagnosis(testResults[pc.id]?.cpu, testResults[pc.id]?.ram).status === 'secondary').length
  const summaryCritical = filteredPcs.filter(pc => getDiagnosis(testResults[pc.id]?.cpu, testResults[pc.id]?.ram).status === 'destructive').length
  const summaryNoData = filteredPcs.filter(pc => getDiagnosis(testResults[pc.id]?.cpu, testResults[pc.id]?.ram).status === 'unknown').length

  return (
    <div className="flex flex-col gap-6">
      
      {/* Admin Toolbar & Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={comboboxOpen}
                className="w-48 justify-between font-normal"
              >
                {selectedClass}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0">
              <Command>
                <CommandInput placeholder="Search class..." />
                <CommandList>
                  <CommandEmpty>No class found.</CommandEmpty>
                  <CommandGroup>
                    {uniqueClasses.map(cls => (
                      <CommandItem
                        key={cls}
                        value={cls}
                        onSelect={(val) => {
                          setSelectedClass(uniqueClasses.find((c) => c.toLowerCase() === val) || cls)
                          setComboboxOpen(false)
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedClass === cls ? "opacity-100" : "opacity-0")} />
                        {cls}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredPcs.length}</span> devices listed
            <span className="font-semibold ml-1 text-emerald-500">{onlinePcs}</span> online
          </span>
        </div>
        <Button
          onClick={startAllTests}
          disabled={startingAll || filteredPcs.length === 0}
          size="sm"
          className="flex items-center gap-2"
        >
          {startingAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {startingAll ? 'Starting…' : selectedClass === 'All Classes' ? 'Start Test on All PCs' : `Start Test on Class ${selectedClass}`}
        </Button>
      </div>

      {/* Inspection Triage Summary */}
      <div className="flex bg-muted/40 border rounded-lg p-3 px-4 text-sm flex-wrap gap-6 items-center justify-between shadow-sm">
        <div className="font-semibold uppercase tracking-widest text-xs text-muted-foreground mix-blend-luminosity">Class Inspection Summary</div>
        <div className="flex gap-6 items-center">
          <span className="flex items-center text-emerald-500 font-medium"><CheckCircle className="w-4 h-4 mr-1.5" /> {summaryHealthy} Healthy</span>
          <span className="flex items-center text-yellow-500 font-medium"><AlertTriangle className="w-4 h-4 mr-1.5" /> {summaryWarning} Warning</span>
          <span className="flex items-center text-red-500 font-medium"><AlertTriangle className="w-4 h-4 mr-1.5" /> {summaryCritical} Need Inspection</span>
          <span className="flex items-center text-muted-foreground font-medium"><Activity className="w-4 h-4 mr-1.5" /> {summaryNoData} Untested</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPcs.map(pc => {
          const offline = isOffline(pc.last_seen)
          const result = testResults[pc.id]
          const diag = getDiagnosis(result?.cpu, result?.ram)

          return (
            <Card key={pc.id} className="flex flex-col justify-between shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between pb-4 bg-muted/20 border-b">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-semibold">{pc.name}</CardTitle>
                  <CardDescription className="text-xs font-mono text-muted-foreground">{pc.id}</CardDescription>
                </div>
                <Badge variant={offline ? "destructive" : "secondary"} className={cn("font-medium", !offline && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/20")}>
                  {offline ? 'Offline' : 'Online'}
                </Badge>
              </CardHeader>
              
              <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Health Status</span>
                    <span className={cn(
                      "text-[11px] font-semibold px-2 py-1 rounded-md border flex items-center",
                      diag.status === 'default' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                      diag.status === 'secondary' ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" :
                      diag.status === 'destructive' ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" :
                      "bg-muted text-muted-foreground border-border"
                    )}>
                      {diag.icon} {diag.label === 'No Data yet' ? 'Pending' : diag.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex flex-col p-3 rounded-md bg-muted/40 border">
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider mb-1">CPU Load</span>
                      <span className="text-lg font-bold">{result ? `${result.cpu.toFixed(1)}%` : '--'}</span>
                    </div>
                    <div className="flex flex-col p-3 rounded-md bg-muted/40 border">
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider mb-1">RAM Alloc</span>
                      <span className="text-lg font-bold">{result ? `${result.ram.toFixed(1)}GB` : '--'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-md border bg-muted/10">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider flex items-center">
                      <Database className="w-3 h-3 mr-1.5 opacity-70"/> Disk Speed
                    </span>
                    <span className="text-sm font-semibold">{result ? `${result.disk_speed.toFixed(1)} MB/s` : '--'}</span>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <Button 
                    size="sm" 
                    variant={result ? "outline" : "default"}
                    className="w-full text-xs font-medium shadow-xs" 
                    onClick={() => startTest(pc.id)}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-2 opacity-70" />
                    {result ? 'Retest Diagnostics' : 'Start Initial Diagnosis'}
                  </Button>
                  {result && <p className="text-[10px] text-muted-foreground mt-3 font-medium">Last test: {new Date(result.created_at).toLocaleTimeString()}</p>}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredPcs.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-lg">
            <RefreshCw className="w-8 h-8 mb-4 animate-spin opacity-20" />
            <p>No devices found in {selectedClass}</p>
          </div>
        )}
      </div>
    </div>
  )
}

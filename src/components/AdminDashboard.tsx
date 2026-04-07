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
    if (cpu > 85 || ram > 85) return { label: 'Critical: Needs Diagnosis', status: 'destructive', icon: <AlertTriangle className="inline w-4 h-4 mr-1 text-red-500" /> }
    if (cpu > 60 || ram > 60) return { label: 'Warning: High Load', status: 'secondary', icon: <AlertTriangle className="inline w-4 h-4 mr-1 text-yellow-500" /> }
    return { label: 'Healthy', status: 'default', icon: <CheckCircle className="inline w-4 h-4 mr-1 text-emerald-500" /> }
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
            <Card key={pc.id} className="overflow-hidden flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/40 border-b">
                <div className="flex flex-col space-y-1">
                  <CardTitle className="text-base font-semibold">{pc.name}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">{pc.id}</CardDescription>
                </div>
                <Badge variant={offline ? "destructive" : "default"} className={!offline ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                  {offline ? 'Offline' : 'Online'}
                </Badge>
              </CardHeader>
              
              <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Performance Diagnosis</p>
                    <div className="flex items-center bg-card border rounded-md px-3 py-2 text-sm font-medium">
                      {diag.icon} {diag.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">CPU Test Load</span>
                      <span className="text-xl font-bold">{result ? `${result.cpu.toFixed(1)}%` : '--'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">RAM Allocation</span>
                      <span className="text-xl font-bold">{result ? `${result.ram.toFixed(1)}GB` : '--'}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col bg-muted/20 p-2 rounded-md mb-4 border border-border/50">
                     <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider flex items-center mb-1"><Database className="w-3 h-3 mr-1"/> Last Disk Scan Speed</span>
                     <span className="text-sm font-bold">{result ? `${result.disk_speed.toFixed(1)} MB/s` : '--'}</span>
                  </div>
                </div>

                <div className="mt-2">
                  <Button size="sm" variant={result ? "outline" : "default"} className="w-full text-xs box-border" onClick={() => startTest(pc.id)}>
                    <Activity className="w-3 h-3 mr-2" />
                    {result ? 'Run Diagnostics Again' : 'Start Initial Diagnosis'}
                  </Button>
                  {result && <p className="text-[10px] text-center mt-2 text-muted-foreground">Tested at: {new Date(result.created_at).toLocaleTimeString()}</p>}
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

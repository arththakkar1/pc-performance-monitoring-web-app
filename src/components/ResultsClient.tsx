"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronsUpDown, Check, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ResultsClient({ initialResults }: { initialResults: any[] }) {
  const [selectedClass, setSelectedClass] = useState<string>('All Classes')
  const [dateFilter, setDateFilter] = useState<string>('All Time')
  const [comboboxOpen, setComboboxOpen] = useState(false)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedClass, dateFilter])

  // Extract classes from pc names
  const getClassFromId = (id: string) => {
    if (!id || !id.includes('-')) return 'Unassigned'
    const parts = id.split('-')
    if (parts.length >= 2) return parts.slice(0, parts.length - 1).join('-')
    return 'Unassigned'
  }

  // Get unique classes from results
  const uniqueClasses = ['All Classes', ...Array.from(new Set(
    (initialResults || []).map(res => getClassFromId(res.pcs?.name || res.pc_id))
  ))].sort()

  const filterByDate = (dateString: string) => {
    if (dateFilter === 'All Time') return true
    
    const d = new Date(dateString)
    const now = new Date()
    
    if (dateFilter === 'Today') {
      return d.toDateString() === now.toDateString()
    }
    if (dateFilter === 'Last 7 Days') {
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 7)
      return d >= sevenDaysAgo
    }
    if (dateFilter === 'This Month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
    if (dateFilter === 'This Year') {
      return d.getFullYear() === now.getFullYear()
    }
    return true
  }

  const filteredResults = (initialResults || []).filter(res => {
    const classMatch = selectedClass === 'All Classes' ? true : getClassFromId(res.pcs?.name || res.pc_id) === selectedClass
    const dateMatch = filterByDate(res.created_at)
    return classMatch && dateMatch
  })

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage)
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="flex flex-col gap-8 max-w-screen-2xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1 block max-md:w-full">
          <h1 className="text-3xl font-bold tracking-tight">Test Results</h1>
          <p className="text-muted-foreground text-sm">
            History of manual performance tests run across agents.
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground flex items-center pr-1">
              <Filter className="w-3.5 h-3.5 mr-1.5" /> Date:
           </span>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex h-9 w-36 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground pr-1">Class:</span>
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
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>PC Name</TableHead>
                <TableHead>CPU (%)</TableHead>
                <TableHead>RAM (GB)</TableHead>
                <TableHead className="text-right">Disk Speed (MB/s)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResults.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No results found for {selectedClass} in {dateFilter}
                  </TableCell>
                </TableRow>
              )}
              {paginatedResults.map((res: any) => (
                <TableRow key={res.id}>
                  <TableCell className="text-muted-foreground">{new Date(res.created_at).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{res.pcs?.name || res.pc_id}</TableCell>
                  <TableCell>{res.cpu.toFixed(2)}</TableCell>
                  <TableCell>{res.ram.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{res.disk_speed.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {filteredResults.length > 0 ? (
              <span>
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredResults.length)}</span> of <span className="font-medium">{filteredResults.length}</span> results
              </span>
            ) : (
              <span>Showing 0 results</span>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

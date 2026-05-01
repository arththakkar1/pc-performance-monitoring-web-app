"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Zap, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";

interface HistoryRecord {
  id: string;
  created_at: string;
  pc_id: string;
  pcs?: { name: string };
  cpu: number;
  ram: number;
  disk_speed: number;
}

interface HistoryClientProps {
  testResults: HistoryRecord[];
  logs: HistoryRecord[];
  isAdmin: boolean;
}

const TESTS_PER_PAGE = 8;
const LOGS_PER_PAGE = 15;

// ─── Pagination bar ───────────────────────────────────────────────────────────
function PaginationBar({
  currentPage,
  totalPages,
  onPage,
}: {
  currentPage: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Build page number buttons (show at most 5 around current)
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i);

  let pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    pages = range(1, totalPages);
  } else {
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);
    pages = [1];
    if (left > 2) pages.push("…");
    pages.push(...range(left, right));
    if (right < totalPages - 1) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === 1}
          onClick={() => onPage(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1 text-muted-foreground text-sm"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "outline"}
              size="icon"
              className="h-8 w-8 text-xs"
              onClick={() => onPage(p as number)}
              aria-label={`Page ${p}`}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === totalPages}
          onClick={() => onPage(currentPage + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HistoryClient({
  testResults,
  logs,
  isAdmin,
}: HistoryClientProps) {
  const [dateFilter, setDateFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [mounted] = useState(true);

  // Separate page state for each tab
  const [testsPage, setTestsPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);

  // Reset pages whenever filters change
  useEffect(() => {
    setTestsPage(1);
    setLogsPage(1);
  }, [dateFilter, classFilter]);

  const filterByDate = (date: string) => {
    if (dateFilter === "all") return true;
    const recordDate = new Date(date);
    const now = new Date();
    if (dateFilter === "today") {
      return recordDate.toDateString() === now.toDateString();
    }
    if (dateFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return recordDate >= weekAgo;
    }
    if (dateFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return recordDate >= monthAgo;
    }
    return true;
  };

  const filterByClass = (r: HistoryRecord) => {
    if (classFilter === "all") return true;
    return r.pc_id === classFilter;
  };

  const filteredTests = testResults.filter(
    (r) => filterByDate(r.created_at) && filterByClass(r),
  );
  const filteredLogs = logs.filter(
    (r) => filterByDate(r.created_at) && filterByClass(r),
  );

  // Pagination slices
  const totalTestsPages = Math.max(
    1,
    Math.ceil(filteredTests.length / TESTS_PER_PAGE),
  );
  const totalLogsPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / LOGS_PER_PAGE),
  );

  const pagedTests = filteredTests.slice(
    (testsPage - 1) * TESTS_PER_PAGE,
    testsPage * TESTS_PER_PAGE,
  );
  const pagedLogs = filteredLogs.slice(
    (logsPage - 1) * LOGS_PER_PAGE,
    logsPage * LOGS_PER_PAGE,
  );

  // Unique PCs for 'Class' filter
  const pcs = Array.from(
    new Set(
      [...testResults, ...logs].map((r) => ({
        id: r.pc_id,
        name: r.pcs?.name || r.pc_id,
      })),
    ),
  ).filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

  const formatDate = (date: string) => {
    if (!mounted) return null;
    return (
      new Date(date).toLocaleDateString() +
      " " +
      new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Activity History
          </h1>
          <p className="text-muted-foreground">
            Review previous diagnostic tests and performance logs.
          </p>
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
                {pcs.map((pc) => (
                  <SelectItem key={pc.id} value={pc.id}>
                    {pc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full md:w-100 grid-cols-2">
          <TabsTrigger value="tests">
            Diagnostic Tests
            {filteredTests.length > 0 && (
              <span className="ml-2 text-[10px] font-mono opacity-60">
                ({filteredTests.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="logs">
            Continuous Logs
            {filteredLogs.length > 0 && (
              <span className="ml-2 text-[10px] font-mono opacity-60">
                ({filteredLogs.length})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Diagnostic Tests tab ──────────────────────────── */}
        <TabsContent value="tests" className="mt-6">
          <div className="grid grid-cols-1 gap-4">
            {filteredTests.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-xl opacity-50">
                <Calendar className="w-10 h-10 mx-auto mb-2" />
                <p>No test results found.</p>
              </div>
            ) : (
              pagedTests.map((test) => (
                <Card
                  key={test.id}
                  className="overflow-hidden border-foreground/5 shadow-none group"
                >
                  <div className="flex items-center justify-between p-4 bg-muted/10 border-b border-foreground/5 transition-colors group-hover:bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="bg-foreground/5 p-2 rounded-lg border border-foreground/10 group-hover:bg-foreground group-hover:text-background transition-colors">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold tracking-tight">
                          {test.pcs?.name || test.pc_id}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {formatDate(test.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-bold tracking-widest uppercase"
                    >
                      Test Case
                    </Badge>
                  </div>
                  <CardContent className="p-4 grid grid-cols-3 gap-8">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">
                        CPU Load
                      </div>
                      <p className="font-black text-xl">
                        {test.cpu.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">
                        RAM GB
                      </div>
                      <p className="font-black text-xl">
                        {test.ram.toFixed(1)}GB
                      </p>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">
                        Disk Speed
                      </div>
                      <p className="font-black text-xl">
                        {test.disk_speed.toFixed(0)} MB/s
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <PaginationBar
            currentPage={testsPage}
            totalPages={totalTestsPages}
            onPage={setTestsPage}
          />
        </TabsContent>

        {/* ── Continuous Logs tab ───────────────────────────── */}
        <TabsContent value="logs" className="mt-6">
          <div className="rounded-xl border border-foreground/5 bg-muted/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-foreground/5">
                <tr>
                  <th className="text-left p-4 font-bold uppercase tracking-widest text-[10px] opacity-60">
                    Device
                  </th>
                  <th className="text-left p-4 font-bold uppercase tracking-widest text-[10px] opacity-60">
                    CPU
                  </th>
                  <th className="text-left p-4 font-bold uppercase tracking-widest text-[10px] opacity-60">
                    RAM
                  </th>
                  <th className="text-right p-4 font-bold uppercase tracking-widest text-[10px] opacity-60">
                    Recorded At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {pagedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-foreground/5 transition-colors group"
                  >
                    <td className="p-4 font-semibold">
                      {log.pcs?.name || log.pc_id}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 w-20 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-foreground transition-all"
                            style={{ width: `${Math.min(log.cpu, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] w-8 text-right opacity-60 group-hover:opacity-100">
                          {log.cpu.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs opacity-60 group-hover:opacity-100">
                      {log.ram.toFixed(1)} GB
                    </td>
                    <td className="p-4 text-right text-muted-foreground text-[10px] uppercase font-medium">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-20 text-center text-muted-foreground opacity-50"
                    >
                      No logs found. Metrics are only logged when active.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            currentPage={logsPage}
            totalPages={totalLogsPages}
            onPage={setLogsPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

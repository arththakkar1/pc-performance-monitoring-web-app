"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity, RefreshCw } from "lucide-react";

type PC = {
  id: string;
  name: string;
  last_seen: string;
  status: string;
};

type Log = {
  id: string;
  pc_id: string;
  cpu: number;
  ram: number;
  created_at: string;
};

export default function DashboardClient({ initialPcs }: { initialPcs: PC[] }) {
  const [pcs, setPcs] = useState<PC[]>(initialPcs);
  const [logs, setLogs] = useState<Record<string, Log[]>>({});
  const supabase = createClient();

  useEffect(() => {
    // Fetch initial logs for each PC (last 20 logs approx 1-2 mins)
    const fetchLogs = async () => {
      const { data } = await supabase
        .from("logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) {
        const grouped = data.reduce(
          (acc, log) => {
            if (!acc[log.pc_id]) acc[log.pc_id] = [];
            acc[log.pc_id].push(log);
            return acc;
          },
          {} as Record<string, Log[]>,
        );

        // Reverse to have chronological order for charts
        Object.keys(grouped).forEach((k) => {
          grouped[k].reverse();
        });
        setLogs(grouped);
      }
    };
    fetchLogs();

    // Realtime subscriptions
    const pcSub = supabase
      .channel("table-db-changes-pcs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pcs" },
        (payload) => {
          setPcs((current) => {
            if (payload.eventType === "INSERT")
              return [...current, payload.new as PC];
            if (payload.eventType === "UPDATE")
              return current.map((p) =>
                p.id === payload.new.id ? (payload.new as PC) : p,
              );
            if (payload.eventType === "DELETE")
              return current.filter((p) => p.id !== payload.old.id);
            return current;
          });
        },
      )
      .subscribe();

    const logSub = supabase
      .channel("table-db-changes-logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "logs" },
        (payload) => {
          const newLog = payload.new as Log;
          setLogs((current) => {
            const pcLogs = current[newLog.pc_id]
              ? [...current[newLog.pc_id], newLog]
              : [newLog];
            // Keep only last 20 elements for the chart
            if (pcLogs.length > 20) pcLogs.shift();
            return { ...current, [newLog.pc_id]: pcLogs };
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pcSub);
      supabase.removeChannel(logSub);
    };
  }, [supabase]);

  const startTest = async (pcId: string) => {
    await supabase.from("commands").insert({
      type: "START_TEST",
      target: pcId,
    });
  };

  const isOffline = (lastSeen: string) => {
    return new Date().getTime() - new Date(lastSeen).getTime() > 10000;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {pcs.map((pc) => {
        const offline = isOffline(pc.last_seen);
        const pcLogs = logs[pc.id] || [];
        const currentCpu =
          pcLogs.length > 0 ? pcLogs[pcLogs.length - 1].cpu : 0;
        const currentRam =
          pcLogs.length > 0 ? pcLogs[pcLogs.length - 1].ram : 0;

        // Format data for Recharts
        const chartData = pcLogs.map((l) => ({
          time: new Date(l.created_at).toLocaleTimeString([], {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          cpu: l.cpu,
          ram: l.ram,
        }));

        return (
          <Card key={pc.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex flex-col space-y-1">
                <CardTitle className="text-base font-semibold">
                  {pc.name}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {pc.id}
                </CardDescription>
              </div>
              <Badge
                variant={offline ? "destructive" : "default"}
                className={
                  !offline ? "bg-emerald-500 hover:bg-emerald-600" : ""
                }
              >
                {offline ? "Offline" : "Online"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                    CPU Usage
                  </span>
                  <span className="text-2xl font-bold">
                    {currentCpu.toFixed(1)}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                    RAM Usage
                  </span>
                  <span className="text-2xl font-bold">
                    {currentRam.toFixed(1)}GB
                  </span>
                </div>
              </div>

              <div className="h-37.5 w-full mt-4 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                  >
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cpu"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="ram"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => startTest(pc.id)}
                >
                  <Activity className="w-3 h-3 mr-2" />
                  Start Test
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {pcs.length === 0 && (
        <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-lg">
          <RefreshCw className="w-8 h-8 mb-4 animate-spin opacity-20" />
          <p>Waiting for agents to connect...</p>
        </div>
      )}
    </div>
  );
}

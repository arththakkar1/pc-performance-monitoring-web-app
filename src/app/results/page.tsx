import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import TopNav from '@/components/TopNav'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function ResultsPage() {
  const supabase = await createClient()

  // Guard: non-admins cannot view results
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) redirect('/')


  const { data: results } = await supabase
    .from('test_results')
    .select('*, pcs(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <>
      <TopNav isAdmin={true} />
      <main className="flex-1 p-6 md:p-8">
        <div className="flex flex-col gap-8 max-w-screen-2xl mx-auto">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Test Results</h1>
            <p className="text-muted-foreground">
              History of manual performance tests run across agents.
            </p>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>PC</TableHead>
                  <TableHead>CPU (%)</TableHead>
                  <TableHead>RAM (GB)</TableHead>
                  <TableHead className="text-right">Disk Speed (MB/s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No results found
                    </TableCell>
                  </TableRow>
                )}
                {results?.map((res: any) => (
                  <TableRow key={res.id}>
                    <TableCell>{new Date(res.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{res.pcs?.name || res.pc_id}</TableCell>
                    <TableCell>{res.cpu.toFixed(2)}</TableCell>
                    <TableCell>{res.ram.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{res.disk_speed.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </>
  )
}

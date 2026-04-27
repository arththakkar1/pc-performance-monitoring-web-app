import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import TopNav from '@/components/TopNav'
import HistoryClient from '@/components/HistoryClient'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const admin = isAdmin(user.email)
  const deviceId = user.user_metadata?.device_id

  if (!admin && !deviceId) {
    return (
      <>
        <TopNav isAdmin={false} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
           <h2 className="text-xl font-semibold">No Device Linked</h2>
           <p className="text-muted-foreground">Please register your device first.</p>
        </div>
      </>
    )
  }

  // Fetch both test results and logs
  let testsQuery = supabase.from('test_results').select('*, pcs(name)')
  let logsQuery = supabase.from('logs').select('*, pcs(name)')

  if (!admin) {
    testsQuery = testsQuery.eq('pc_id', deviceId)
    logsQuery = logsQuery.eq('pc_id', deviceId)
  }

  const [ { data: testResults }, { data: logs } ] = await Promise.all([
    testsQuery.order('created_at', { ascending: false }).limit(200),
    logsQuery.order('created_at', { ascending: false }).limit(200)
  ])

  return (
    <>
      <TopNav isAdmin={admin} />
      <main className="flex-1 p-6 md:p-8">
        <HistoryClient 
          testResults={testResults || []} 
          logs={logs || []} 
          isAdmin={admin} 
        />
      </main>
    </>
  )
}

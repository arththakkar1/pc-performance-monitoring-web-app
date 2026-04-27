import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import TopNav from '@/components/TopNav'
import AnalyticsClient from '@/components/AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const admin = isAdmin(user.email)
  const deviceId = user.user_metadata?.device_id

  // If not admin and no device linked, they have nothing to see
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

  let query = supabase
    .from('test_results')
    .select('*, pcs(name)')
  
  if (!admin) {
    query = query.eq('pc_id', deviceId)
  }

  const { data: results } = await query
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <>
      <TopNav isAdmin={admin} />
      <main className="flex-1 p-6 md:p-8">
        <AnalyticsClient results={results || []} isAdmin={admin} />
      </main>
    </>
  )
}

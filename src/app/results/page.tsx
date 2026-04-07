import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import TopNav from '@/components/TopNav'
import ResultsClient from '@/components/ResultsClient'

export default async function ResultsPage() {
  const supabase = await createClient()

  // Guard: non-admins cannot view results
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) redirect('/')

  const { data: results } = await supabase
    .from('test_results')
    .select('*, pcs(name)')
    .order('created_at', { ascending: false })
    .limit(1000)

  return (
    <>
      <TopNav isAdmin={true} />
      <main className="flex-1 p-6 md:p-8">
        <ResultsClient initialResults={results || []} />
      </main>
    </>
  )
}

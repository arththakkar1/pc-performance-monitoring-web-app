import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth'
import AdminDashboard from '@/components/AdminDashboard'
import DeviceView from '@/components/DeviceView'
import TopNav from '@/components/TopNav'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const email = user?.email ?? ''
  const admin = isAdmin(email)

  if (admin) {
    // Admin: fetch all PCs
    const { data: pcs } = await supabase
      .from('pcs')
      .select('*')
      .order('name')

    return (
      <>
        <TopNav isAdmin={true} />
        <main className="flex-1 p-6 md:p-8">
          <div className="flex flex-col gap-6 max-w-screen-2xl mx-auto">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <span className="text-xs font-bold bg-foreground text-background px-2 py-0.5 rounded-full uppercase tracking-widest">Admin</span>
              </div>
              <p className="text-muted-foreground">
                Real-time monitoring for all connected devices. Start tests individually or all at once.
              </p>
            </div>
            <AdminDashboard initialPcs={pcs || []} />
          </div>
        </main>
      </>
    )
  }

  // Non-admin: look up their device by device_id metadata
  const deviceId = user?.user_metadata?.device_id as string | null
  let pc = null

  if (deviceId) {
    // Try matching on pcs.name (the device registers itself by name = device_id)
    const { data } = await supabase
      .from('pcs')
      .select('*')
      .eq('id', deviceId)
      .maybeSingle()
    pc = data
  }

  return (
    <>
      <TopNav isAdmin={false} />
      <main className="flex-1 p-6 md:p-8">
        <div className="flex flex-col gap-6 max-w-screen-2xl mx-auto">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">My Device</h1>
            <p className="text-muted-foreground">
              Live performance view for your assigned device.
            </p>
          </div>
          <DeviceView pc={pc} deviceId={deviceId} />
        </div>
      </main>
    </>
  )
}

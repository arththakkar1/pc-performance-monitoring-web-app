import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { RegisterForm } from '@/components/RegisterForm'

export default async function RegisterPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams
  const errorMsg = searchParams?.error

  const signup = async (formData: FormData) => {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const deviceId = formData.get('deviceId') as string
    const className = formData.get('className') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          device_id: deviceId || null,
          class_name: className || null,
        },
      },
    })

    if (error) {
      redirect('/register?error=' + encodeURIComponent(error.message))
    }

    redirect('/')
  }

  /**
   * Returns the next auto-incremented device ID for a given class.
   * e.g. if 308-B-1 and 308-B-2 exist → returns "308-B-3"
   */
  const getNextDeviceId = async (className: string): Promise<string> => {
    'use server'
    const supabase = await createClient()

    // Query existing device IDs that start with this class prefix
    const prefix = `${className}-`
    const { data, error } = await supabase
      .from('profiles')
      .select('device_id')
      .like('device_id', `${prefix}%`)

    if (error || !data || data.length === 0) {
      return `${prefix}1`
    }

    // Extract the numeric suffixes and find the max
    const nums = data
      .map(row => {
        const id = row.device_id as string | null
        if (!id) return 0
        const suffix = id.slice(prefix.length)
        const n = parseInt(suffix, 10)
        return isNaN(n) ? 0 : n
      })
      .filter(n => n > 0)

    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1
    return `${prefix}${nextNum}`
  }

  return (
    <>
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
        <ThemeToggle />
      </div>
      <RegisterForm
        errorMsg={errorMsg}
        signup={signup}
        getNextDeviceId={getNextDeviceId}
      />
    </>
  )
}

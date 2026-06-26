import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase-server'

// This page just routes traffic — authenticated users go to dashboard,
// unauthenticated users go to login.
export default async function RootPage() {
  const user = await getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}

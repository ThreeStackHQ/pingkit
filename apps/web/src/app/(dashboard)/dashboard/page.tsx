import { redirect } from 'next/navigation'

// Dashboard root redirects to monitors (the main view)
export default function DashboardPage() {
  redirect('/monitors')
}

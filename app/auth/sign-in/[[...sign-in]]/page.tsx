import { SignIn } from '@clerk/nextjs'
import { AuthShell, clerkAppearance } from '@/components/auth-shell'

export default function SignInPage() {
  return (
    <AuthShell blurb="Sign in to add routes, manage origin pools and see your traffic.">
      <SignIn appearance={clerkAppearance} />
    </AuthShell>
  )
}

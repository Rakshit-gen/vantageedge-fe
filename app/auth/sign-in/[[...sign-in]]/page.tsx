import { SignIn } from '@clerk/nextjs'
import { AuthShell, clerkAppearance } from '@/components/auth-shell'

export default function SignInPage() {
  return (
    <AuthShell blurb="Sign in to the console to patch routes, manage the origin pool, and watch traffic cross the board.">
      <SignIn appearance={clerkAppearance} />
    </AuthShell>
  )
}

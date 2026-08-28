import { SignUp } from '@clerk/nextjs'
import { AuthShell, clerkAppearance } from '@/components/auth-shell'

export default function SignUpPage() {
  return (
    <AuthShell blurb="Create an account and a tenant is provisioned for you: your own subdomain, origins, routes and keys, isolated from everyone else's.">
      <SignUp appearance={clerkAppearance} />
    </AuthShell>
  )
}

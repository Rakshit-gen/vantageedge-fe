import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 relative overflow-hidden p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      {/* Gradient orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Sign up component */}
      <div className="relative z-10 w-full max-w-md">
        <SignUp 
          appearance={{
            variables: {
              colorPrimary: 'hsl(262 83% 58%)',
              colorBackground: 'hsl(240 8% 6%)',
              colorInputBackground: 'hsl(240 6% 10%)',
              colorInputText: 'hsl(0 0% 98%)',
              colorText: 'hsl(0 0% 98%)',
              colorTextSecondary: 'hsl(240 4% 65%)',
              colorShimmer: 'hsl(262 83% 58% / 0.1)',
              borderRadius: '0.75rem',
            },
            elements: {
              rootBox: "mx-auto w-full",
              card: "bg-card/95 backdrop-blur-xl border border-border shadow-2xl",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border",
              socialButtonsBlockButtonText: "text-foreground",
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
              formFieldInput: "bg-input border-border text-foreground",
              formFieldLabel: "text-foreground",
              formFieldSuccessText: "text-success",
              formFieldErrorText: "text-destructive",
              footerActionLink: "text-primary hover:text-primary/80",
              identityPreviewText: "text-foreground",
              identityPreviewEditButton: "text-primary hover:text-primary/80",
              otpCodeFieldInput: "bg-input border-border text-foreground",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
            }
          }}
        />
      </div>
    </div>
  )
}

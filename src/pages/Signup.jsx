import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Mic, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ThemeToggle'
import { signUp } from '@/lib/auth'
import { toast } from 'sonner'

const PASSWORD_MIN = 8

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= PASSWORD_MIN },
    { label: 'Contains a number', pass: /\d/.test(password) },
    { label: 'Contains uppercase letter', pass: /[A-Z]/.test(password) },
  ]

  if (!password) return null

  return (
    <ul className="mt-2 space-y-1">
      {checks.map(({ label, pass }) => (
        <li key={label} className="flex items-center gap-2 text-xs">
          <CheckCircle2
            className={`size-3.5 shrink-0 ${pass ? 'text-green-500' : 'text-muted-foreground/40'}`}
          />
          <span className={pass ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
        </li>
      ))}
    </ul>
  )
}

export default function Signup() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (!email || !password || !confirm) {
      toast.error('Please fill in all fields')
      return
    }
    if (password.length < PASSWORD_MIN) {
      toast.error(`Password must be at least ${PASSWORD_MIN} characters`)
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const data = await signUp(email, password)

      // Supabase may or may not require email confirmation depending on project settings.
      // If a session comes back immediately the user is logged in right away.
      if (data?.session) {
        toast.success('Account created! Welcome to NoteFlow 🎉')
        navigate('/dashboard', { replace: true })
      } else {
        toast.success('Account created! Check your email to confirm your address.')
        navigate('/login', { replace: true })
      }
    } catch (err) {
      toast.error(err.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mic className="size-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">NoteFlow</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Decorative glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <Card className="relative shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
              <CardDescription>Start capturing smarter notes with AI</CardDescription>
            </CardHeader>

            <CardContent>
              <form id="signup-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      disabled={loading}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {confirm && password !== confirm && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>

                <Button
                  id="signup-submit"
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  form="signup-form"
                >
                  {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {loading ? 'Creating account…' : 'Create account'}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex justify-center text-sm text-muted-foreground">
              Already have an account?&nbsp;
              <Link
                to="/login"
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
              >
                Sign in
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}

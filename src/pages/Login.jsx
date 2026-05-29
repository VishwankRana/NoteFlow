import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Loader2, Mic, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ThemeToggle'
import { signIn } from '@/lib/auth'
import { toast } from 'sonner'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.message || 'Login failed')
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
              <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
              <CardDescription>Enter your email and password to continue</CardDescription>
            </CardHeader>

            <CardContent>
              <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
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
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
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
                </div>

                <Button
                  id="login-submit"
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  form="login-form"
                >
                  {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {loading ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex justify-center text-sm text-muted-foreground">
              Don&apos;t have an account?&nbsp;
              <Link
                to="/signup"
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
              >
                Sign up
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}

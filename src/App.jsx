import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SupabaseStatus } from '@/components/SupabaseStatus'
import { toast } from 'sonner'

function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight">NoteFlow</span>
          <Badge variant="secondary">Step 2</Badge>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Supabase setup</CardTitle>
            <CardDescription>
              Run the SQL migration in your Supabase project, add keys to <code className="text-xs">.env</code>, then test the connection below.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <SupabaseStatus />
            <Button
              variant="secondary"
              onClick={() =>
                toast.success('NoteFlow is ready', {
                  description: 'Toast notifications are working.',
                })
              }
            >
              Test toast
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="noteflow-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </ThemeProvider>
  )
}

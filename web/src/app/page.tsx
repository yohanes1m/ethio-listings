import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
      <h1 className="text-4xl font-bold tracking-tight text-center">
        <span className="text-primary">Ethio</span>Listings
      </h1>
      <p className="text-muted-foreground text-center max-w-sm">
        Ethiopian real estate marketplace — houses, land, cars, and machines. Full home page coming in Phase 10.
      </p>
      <div className="flex gap-3">
        <Link href="/auth/login">
          <Button>Sign In</Button>
        </Link>
        <Link href="/auth/register">
          <Button variant="outline">Register</Button>
        </Link>
      </div>
    </main>
  )
}

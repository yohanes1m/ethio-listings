import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="text-2xl font-bold tracking-tight text-primary">EthioListings</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}

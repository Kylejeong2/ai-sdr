import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm z-50 border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            GrahamSDR
          </Link>
          <div className="flex gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            AI-Powered Sales Development
            <span className="text-primary block mt-2">That Actually Works</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            Automate your lead qualification and outreach with personalized, AI-driven campaigns that convert prospects into customers.
          </p>
          <div className="mt-10">
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need for Effective Sales Outreach
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-lg shadow-sm border"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Sales Process?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join hundreds of companies using GrahamSDR to automate their sales development and close more deals.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="text-lg px-8">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              © 2023 GrahamSDR. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    title: 'Smart Lead Detection',
    description: 'Automatically identify and qualify leads based on their signup data and behavior.',
    icon: (
      <svg
        className="w-6 h-6 text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    title: 'AI-Powered Enrichment',
    description: 'Enrich lead data using LinkedIn and company information for better targeting.',
    icon: (
      <svg
        className="w-6 h-6 text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: 'Personalized Campaigns',
    description: 'Generate highly personalized email campaigns that resonate with your prospects.',
    icon: (
      <svg
        className="w-6 h-6 text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
]

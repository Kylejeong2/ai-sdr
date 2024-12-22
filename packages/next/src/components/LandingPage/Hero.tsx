'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Shield, Code, Users } from 'lucide-react';

export function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-primary/5 to-background dark:from-primary/10 dark:to-background">
      <div className="container mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-8">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Powered by AI</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight dark:text-white">
          Sales Development
          <span className="text-primary block mt-2">Reimagined with AI</span>
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
          Automate your lead qualification and outreach with personalized, AI-driven campaigns that convert prospects into customers.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sign-up">
            <Button size="lg" className="text-lg px-8">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-lg px-8">
            Watch Demo
          </Button>
        </div>
        <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> SOC 2 Compliant
          </div>
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4" /> Open API
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" /> 10k+ Users
          </div>
        </div>
      </div>
    </section>
  );
} 
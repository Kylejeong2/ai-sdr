'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <Clock className="h-16 w-16 text-primary mb-8 animate-pulse" />
      <h1 className="text-4xl font-bold text-center mb-4 dark:text-white">{title}</h1>
      <p className="text-xl text-muted-foreground text-center mb-8 max-w-2xl">
        {description || "This page is coming soon. We're working hard to bring you something amazing."}
      </p>
      <Link href="/">
        <Button variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
} 
'use client';

import { Star } from 'lucide-react';
import Image from 'next/image';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Head of Sales, TechCorp',
    company: 'TechCorp',
    image: '/testimonials/sarah.jpg',
    quote: 'Graham has transformed our sales process. The AI-powered lead detection is incredibly accurate, and we\'ve seen a 3x increase in qualified leads.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'SDR Manager, GrowthCo',
    company: 'GrowthCo',
    image: '/testimonials/michael.jpg',
    quote: 'The automated campaigns and enrichment features have doubled our response rates. Our team is more productive than ever.',
    rating: 5,
  },
  {
    name: 'Emma Davis',
    role: 'VP Sales, ScaleUp Inc',
    company: 'ScaleUp Inc',
    image: '/testimonials/emma.jpg',
    quote: "Best investment we've made for our sales team. The ROI was clear within the first month, and the AI keeps getting smarter.",
    rating: 5,
  },
  {
    name: 'David Wilson',
    role: 'Sales Director, CloudTech',
    company: 'CloudTech',
    image: '/testimonials/david.jpg',
    quote: 'The integration with our existing CRM was seamless. Graham has become an essential part of our sales stack.',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-primary/5 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 dark:text-white">
            Trusted by Industry Leaders
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how leading companies are transforming their sales process with Graham.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-primary/10">
                  {/* Note: Add actual images in public/testimonials/ directory */}
                  <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-primary">
                    {testimonial.name[0]}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-lg dark:text-white">{testimonial.name}</h4>
                  <p className="text-muted-foreground">{testimonial.role}</p>
                  <div className="flex mt-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <blockquote className="text-lg text-muted-foreground">
                "{testimonial.quote}"
              </blockquote>
              <div className="mt-6 pt-6 border-t dark:border-gray-700">
                <p className="text-sm font-medium dark:text-white">{testimonial.company}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-lg text-muted-foreground mb-8">
            Join hundreds of companies already using Graham
          </p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50">
            {/* Add company logos here */}
            {['TechCorp', 'GrowthCo', 'ScaleUp Inc', 'CloudTech'].map((company) => (
              <div
                key={company}
                className="text-xl font-bold text-muted-foreground dark:text-gray-400"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 
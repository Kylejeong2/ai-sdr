'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: '$49',
    billing: 'per user/month',
    description: 'Perfect for individuals and small teams getting started.',
    features: [
      'Up to 1,000 leads/month',
      'Basic AI lead scoring',
      'Email campaign automation',
      'CRM integration',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Start Free Trial',
    href: '/sign-up?plan=starter',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$99',
    billing: 'per user/month',
    description: 'Ideal for growing teams that need more power.',
    features: [
      'Up to 5,000 leads/month',
      'Advanced AI lead scoring',
      'Custom automation workflows',
      'Advanced CRM integration',
      'Advanced analytics & reporting',
      'Priority email & chat support',
      'Team collaboration tools',
      'Custom templates',
    ],
    cta: 'Start Free Trial',
    href: '/sign-up?plan=professional',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    billing: 'contact for pricing',
    description: 'For large teams with custom needs.',
    features: [
      'Unlimited leads',
      'Custom AI model training',
      'Advanced security features',
      'Dedicated account manager',
      'Custom integrations',
      '24/7 phone support',
      'SLA guarantee',
      'On-premise deployment option',
      'Custom reporting',
    ],
    cta: 'Contact Sales',
    href: '/contact-sales',
    popular: false,
  },
];

export function Pricing() {
  return (
    <section className="py-20 dark:bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 dark:text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the plan that best fits your needs. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white dark:bg-gray-900 rounded-xl shadow-sm transition-all hover:shadow-lg
                ${
                  plan.popular
                    ? 'ring-2 ring-primary scale-105 md:scale-110'
                    : 'border dark:border-gray-800'
                }
              `}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-primary py-2 text-center text-sm font-medium text-white">
                  Most Popular
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold dark:text-white mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold dark:text-white">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">{plan.billing}</span>
                </div>
                <p className="text-muted-foreground mb-6">{plan.description}</p>

                <Link href={plan.href}>
                  <Button
                    className="w-full mb-8"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            All plans include:
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <span>No credit card required</span>
            <span>14-day free trial</span>
            <span>Cancel anytime</span>
            <span>24/7 support</span>
            <span>99.9% uptime SLA</span>
          </div>
        </div>
      </div>
    </section>
  );
} 
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Check } from "lucide-react"

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  const tiers = [
    {
      name: "Starter",
      description: "Perfect for trying out our platform",
      price: annual ? 29 : 39,
      features: [
        "Up to 500 leads",
        "1,000 emails/month",
        "Basic enrichment",
        "Email tracking",
        "1 team member",
        "Community support",
      ],
    },
    {
      name: "Pro",
      description: "Best for growing businesses",
      price: annual ? 79 : 99,
      popular: true,
      features: [
        "Up to 2,500 leads",
        "5,000 emails/month",
        "Advanced enrichment",
        "Email & link tracking",
        "5 team members",
        "Priority support",
        "Custom templates",
        "API access",
      ],
    },
    {
      name: "Enterprise",
      description: "For large scale operations",
      price: "Custom",
      features: [
        "Unlimited leads",
        "Unlimited emails",
        "Premium enrichment",
        "Advanced analytics",
        "Unlimited team members",
        "Dedicated support",
        "Custom integrations",
        "SLA guarantee",
        "Custom deployment",
      ],
    },
  ]

  return (
    <div className="container py-20">
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-4xl font-bold tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect plan for your business. All plans include a 14-day
          free trial.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <span
            className={annual ? "text-muted-foreground" : "font-medium"}
          >
            Monthly
          </span>
          <Switch
            checked={annual}
            onCheckedChange={setAnnual}
          />
          <span
            className={annual ? "font-medium" : "text-muted-foreground"}
          >
            Annual <span className="text-green-500">(Save 20%)</span>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={
              tier.popular
                ? "border-primary shadow-lg relative"
                : undefined
            }
          >
            {tier.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-baseline justify-between">
                <span>{tier.name}</span>
                <span>
                  {typeof tier.price === "number" ? (
                    <>
                      <span className="text-3xl font-bold">
                        ${tier.price}
                      </span>
                      <span className="text-muted-foreground">
                        /mo
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold">
                      {tier.price}
                    </span>
                  )}
                </span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {tier.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={tier.popular ? "default" : "outline"}
              >
                {tier.name === "Enterprise"
                  ? "Contact Sales"
                  : "Start Free Trial"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-20 text-center space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">
          Frequently Asked Questions
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8 text-left">
          <div>
            <h3 className="font-medium mb-2">
              Can I change plans later?
            </h3>
            <p className="text-sm text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. Changes
              will be reflected in your next billing cycle.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">
              What happens after my trial?
            </h3>
            <p className="text-sm text-muted-foreground">
              After your 14-day trial, you'll be automatically subscribed to
              your chosen plan unless you cancel.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">
              Do you offer refunds?
            </h3>
            <p className="text-sm text-muted-foreground">
              Yes, we offer a 30-day money-back guarantee. No questions asked.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards, PayPal, and wire transfers for
              enterprise plans.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">
              Do you offer custom plans?
            </h3>
            <p className="text-sm text-muted-foreground">
              Yes, we offer custom plans for large organizations. Contact our
              sales team to learn more.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">
              What kind of support do you offer?
            </h3>
            <p className="text-sm text-muted-foreground">
              We offer email support for all plans, with priority support for
              Pro and dedicated support for Enterprise.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
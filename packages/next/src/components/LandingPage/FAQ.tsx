'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What makes Graham different from other sales tools?",
    answer: "Graham combines advanced AI technology with proven sales methodologies. Our platform uses machine learning to automate lead qualification, personalize outreach, and provide actionable insights - all while maintaining a human touch in your sales process."
  },
  {
    question: "How does the AI-powered lead detection work?",
    answer: "Our AI analyzes multiple data points including company information, social media presence, and historical engagement patterns to identify high-quality leads. The system continuously learns from successful conversions to improve its accuracy over time."
  },
  {
    question: "Can I integrate Graham with my existing CRM?",
    answer: "Yes! Graham seamlessly integrates with popular CRM platforms including Salesforce, HubSpot, and Pipedrive. We also offer a robust API for custom integrations with your existing tech stack."
  },
  {
    question: "What kind of support do you offer?",
    answer: "We provide 24/7 technical support, comprehensive documentation, video tutorials, and a dedicated customer success manager for enterprise plans. Our team is committed to ensuring you get the most out of Graham."
  },
  {
    question: "Is my data secure with Graham?",
    answer: "Absolutely. We maintain SOC 2 compliance and implement enterprise-grade security measures including end-to-end encryption, regular security audits, and strict access controls to protect your data."
  },
  {
    question: "How long does it take to get started?",
    answer: "You can be up and running with Graham in minutes. Our intuitive onboarding process guides you through the setup, and our team is available to help with data migration and integration if needed."
  },
  {
    question: "What's your pricing model?",
    answer: "We offer flexible pricing plans based on your team size and needs. All plans include core features, with additional capabilities available in our Professional and Enterprise tiers. Contact our sales team for detailed pricing information."
  },
  {
    question: "Can I try Graham before committing?",
    answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start your trial."
  }
];

export function FAQ() {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know about Graham and how it can transform your sales process.
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700"
              >
                <AccordionTrigger className="px-6 text-left hover:no-underline hover:text-primary dark:text-white">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
} 
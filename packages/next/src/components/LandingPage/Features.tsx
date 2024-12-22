'use client';

import { Bot, Zap, LineChart, Users, Mail, Shield, Brain, Workflow, Database } from 'lucide-react';

const features = [
  {
    title: 'AI-Powered Lead Detection',
    description: 'Automatically identify and qualify leads using advanced machine learning algorithms.',
    icon: <Bot className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Smart Enrichment',
    description: 'Enrich lead data using LinkedIn and company information for better targeting.',
    icon: <Zap className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Advanced Analytics',
    description: 'Track performance metrics and optimize your campaigns with detailed insights.',
    icon: <LineChart className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Team Collaboration',
    description: 'Work together efficiently with role-based access and shared templates.',
    icon: <Users className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Automated Campaigns',
    description: 'Create and manage personalized email sequences that convert.',
    icon: <Mail className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Enterprise Security',
    description: 'SOC 2 compliant with advanced security features and encryption.',
    icon: <Shield className="h-6 w-6 text-primary" />,
  },
  {
    title: 'AI Conversation Analysis',
    description: 'Deep learning models analyze conversation patterns to improve engagement.',
    icon: <Brain className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Workflow Automation',
    description: 'Create custom workflows to automate repetitive sales tasks.',
    icon: <Workflow className="h-6 w-6 text-primary" />,
  },
  {
    title: 'Data Integration',
    description: 'Seamlessly connect with your existing CRM and sales tools.',
    icon: <Database className="h-6 w-6 text-primary" />,
  },
];

export function Features() {
  return (
    <section className="py-20 dark:bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 dark:text-white">
            Everything You Need for Effective Sales Outreach
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our comprehensive suite of tools helps you streamline your sales process and close more deals.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-800 hover:shadow-lg transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 
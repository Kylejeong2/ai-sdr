'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { 
  Building2, 
  CheckCircle2, 
  Settings,
  Users,
  ChevronRight
} from 'lucide-react'

const steps = [
  {
    id: 'organization',
    title: 'Create Organization',
    description: 'Set up your company workspace',
    icon: Building2,
    isSkippable: false,
    href: '/org-selection'
  },
  {
    id: 'invite',
    title: 'Invite Team Members',
    description: 'Add your colleagues',
    icon: Users,
    isSkippable: true,
    href: '/organization/{orgId}/members/invite'
  },
  {
    id: 'clerk',
    title: 'Connect Clerk',
    description: 'Set up user authentication',
    icon: Settings,
    isSkippable: true,
    href: '/dashboard/settings/clerk'
  },
  {
    id: 'complete',
    title: 'Ready to Go',
    description: 'Start using Graham SDR',
    icon: CheckCircle2,
    isSkippable: false,
    href: '/dashboard'
  }
]

export default function OnboardingPage() {
  const router = useRouter()
  const { organization, isLoaded } = useOrganization()
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (!isLoaded) return

    if (organization) {
      setCurrentStep(1)
    }
  }, [isLoaded, organization])

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    const currentStepData = steps[currentStep]
    
    if (currentStepData.href) {
      const href = currentStepData.href.replace('{orgId}', organization?.id || '')
      router.push(href)
      
      // Only advance to next step after navigation
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1)
      }
    }
  }

  const handleSkip = () => {
    const currentStepData = steps[currentStep]
    if (currentStepData.isSkippable && currentStep < steps.length - 1) {
      // Skip directly to next step without navigation
      setCurrentStep(prev => prev + 1)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="p-8 w-full max-w-4xl space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            Welcome to Graham SDR
          </h1>
          <p className="text-gray-400 text-lg">
            Let's get your workspace set up in just a few steps
          </p>
        </div>

        <Progress value={progress} className="h-2 bg-gray-800" />

        <div className="grid gap-6">
          {steps.map((step, index) => (
            <Card
              key={step.id}
              className={cn(
                'p-6 border-gray-800 bg-gray-900/50 backdrop-blur-sm transition-all duration-200',
                index === currentStep && 'ring-2 ring-blue-500',
                index < currentStep && 'opacity-50'
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'p-2 rounded-full',
                  index === currentStep && 'bg-blue-500/20',
                  index < currentStep && 'bg-green-500/20',
                  index > currentStep && 'bg-gray-800'
                )}>
                  <step.icon className={cn(
                    'h-6 w-6',
                    index === currentStep && 'text-blue-400',
                    index < currentStep && 'text-green-400',
                    index > currentStep && 'text-gray-400'
                  )} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
                {index === currentStep && (
                  <div className="flex items-center gap-2">
                    {step.isSkippable && (
                      <Button
                        variant="ghost"
                        onClick={handleSkip}
                        className="text-gray-400 hover:text-white"
                      >
                        Skip
                      </Button>
                    )}
                    <Button
                      onClick={handleNext}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {index === steps.length - 1 ? 'Finish' : 'Continue'}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
                {index < currentStep && (
                  <div className="p-2 rounded-full bg-green-500/20">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
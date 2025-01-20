import { Suspense } from 'react'
import { CalComSettingsForm } from './calcom-settings-form'
import { CalendlySettingsForm } from './calendly-settings-form'

export default function CalendarSettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Calendar Integration Settings</h2>
        <p className="text-gray-600 mb-8">
          Configure your calendar integrations to automatically enrich data from meeting bookings.
        </p>
      </div>

      <div className="grid gap-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Cal.com Integration</h3>
          <Suspense fallback={<div>Loading Cal.com settings...</div>}>
            <CalComSettingsForm />
          </Suspense>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Calendly Integration</h3>
          <Suspense fallback={<div>Loading Calendly settings...</div>}>
            <CalendlySettingsForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
} 
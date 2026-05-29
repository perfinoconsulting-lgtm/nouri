'use client'

import { Fragment } from 'react'

interface Props {
  currentStep: number
  totalSteps: number
  labels?: string[]
}

export default function ProgressWizard({ currentStep, totalSteps, labels }: Props) {
  return (
    <div className="flex items-start justify-center w-full px-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1
        const isPast = step < currentStep
        const isActive = step === currentStep
        const isFuture = step > currentStep

        return (
          <Fragment key={step}>
            {/* Ligne de connexion — mt-5 centre la ligne avec le cercle de 40px */}
            {i > 0 && (
              <div
                className={`flex-1 h-0.5 mt-5 transition-colors duration-[400ms] ${
                  i < currentStep ? 'bg-[#27AE60]' : 'bg-gray-300'
                }`}
              />
            )}

            {/* Cercle + label optionnel */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={[
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-[400ms]',
                  isPast ? 'bg-[#27AE60] text-white shadow-sm' : '',
                  isActive ? 'bg-[#F5A623] text-[#1A3A5C]' : '',
                  isFuture ? 'bg-white border-2 border-gray-300 text-gray-400' : '',
                ].filter(Boolean).join(' ')}
                style={
                  isActive
                    ? {
                        animation: 'stepFill 400ms ease-out',
                        boxShadow: '0 0 16px rgba(245,166,35,0.45)',
                      }
                    : undefined
                }
              >
                {isPast ? '✓' : step}
              </div>

              {labels?.[i] && (
                <span
                  className={`text-xs font-medium text-center leading-tight ${
                    isActive ? 'text-[#F5A623]' : isPast ? 'text-[#27AE60]' : 'text-gray-400'
                  }`}
                >
                  {labels[i]}
                </span>
              )}
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}

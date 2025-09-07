import React from 'react';
import { Step } from '../types';

interface StepsListProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: Step) => void;
}

export function StepsList({ steps, currentStep, onStepClick }: StepsListProps) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div
          key={step.id}
          onClick={() => onStepClick?.(step)}
          className={`p-3 rounded-lg text-sm border transition-colors cursor-pointer ${
            step.status === 'completed'
              ? 'bg-green-500/20 border-green-500/30 text-green-200'
              : step.status === 'in-progress'
              ? 'bg-blue-500/20 border-blue-500/30 text-blue-200'
              : 'bg-white/5 border-white/5 text-gray-200 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              step.status === 'completed'
                ? 'bg-green-500'
                : step.status === 'in-progress'
                ? 'bg-blue-500'
                : 'bg-gray-500'
            }`} />
            <span className="font-medium">{step.title}</span>
          </div>
          {step.description && (
            <p className="text-xs text-gray-400 mt-1 ml-4">{step.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}

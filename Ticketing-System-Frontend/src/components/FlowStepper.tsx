import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  label: string;
}

interface FlowStepperProps {
  steps: Step[];
  currentStepIndex: number;
}

export const FlowStepper: React.FC<FlowStepperProps> = ({ steps, currentStepIndex }) => {
  return (
    <div className="w-full max-w-xl mx-auto mb-8 px-2">
      <div className="flex items-center justify-between relative">
        {/* Connector line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-slate-800 -z-0">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
            style={{
              width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Step dots */}
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950 ring-4 ring-slate-950'
                    : isCurrent
                    ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20 shadow-lg shadow-cyan-500/30 font-extrabold'
                    : 'bg-slate-900 border border-slate-700 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
              </div>
              <span
                className={`text-[11px] mt-1.5 font-medium whitespace-nowrap hidden sm:block ${
                  isCurrent ? 'text-cyan-300 font-semibold' : isDone ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

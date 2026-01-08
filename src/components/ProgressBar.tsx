'use client';

import { ProgressBarProps } from '@/types';

export default function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  const getStepIcon = (step: any) => {
    switch (step.status) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'processing':
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default: // pending
        return (
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          </div>
        );
    }
  };

  const getStepColor = (step: any, isLast: boolean) => {
    if (isLast) return '';
    
    switch (step.status) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-200';
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>全体進捗</span>
          <span>
            {steps.filter(s => s.status === 'completed').length} / {steps.length} 完了
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ 
              width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Step Details */}
      <div className="space-y-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isActive = step.id === currentStep;
          
          return (
            <div key={step.id} className="flex items-start">
              {/* Step Icon and Connector */}
              <div className="flex flex-col items-center mr-4">
                {getStepIcon(step)}
                {!isLast && (
                  <div className={`w-0.5 h-12 mt-2 transition-all duration-300 ${getStepColor(step, isLast)}`}></div>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 pb-8">
                <div className={`flex items-center justify-between ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>
                  <h4 className="font-semibold">{step.name}</h4>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    {step.status === 'processing' && (
                      <span className="text-blue-600 font-medium">{step.progress}%</span>
                    )}
                    {step.endTime && step.startTime && (
                      <span>{formatTime(step.endTime - step.startTime)}</span>
                    )}
                  </div>
                </div>

                {/* Step Progress Bar */}
                {step.status === 'processing' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${step.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Step Details */}
                {step.details && (
                  <p className="text-sm text-gray-600 mt-1">{step.details}</p>
                )}

                {/* Evidence */}
                {step.evidence && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                    {step.evidence}
                  </div>
                )}

                {/* Status Messages */}
                {step.status === 'error' && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-800">
                    エラーが発生しました
                  </div>
                )}
                
                {step.status === 'completed' && (
                  <div className="mt-2 text-sm text-green-600 font-medium">
                    ✓ 完了
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
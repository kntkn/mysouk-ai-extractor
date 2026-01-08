'use client';

import { useEffect, useRef } from 'react';
import { StreamingLogProps } from '@/types';

export default function StreamingLog({ logs, autoScroll = true }: StreamingLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success':
        return (
          <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'warn':
        return (
          <div className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default: // info
        return (
          <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          </div>
        );
    }
  };

  const getLogStyle = (level: string) => {
    switch (level) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warn':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextStyle = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warn':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  if (logs.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm">ログが表示されます</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-96 overflow-y-auto p-4 space-y-2 bg-gray-50 font-mono text-sm"
    >
      {logs.map((log) => (
        <div 
          key={log.id} 
          className={`p-3 rounded-lg border ${getLogStyle(log.level)} transition-all duration-200`}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getLogIcon(log.level)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`font-medium ${getTextStyle(log.level)}`}>
                  {log.message}
                </span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatTime(log.timestamp)}
                </span>
              </div>

              {/* Details */}
              {log.details && (
                <div className="mt-2 p-2 bg-white/50 rounded text-xs text-gray-700">
                  {typeof log.details === 'string' 
                    ? log.details 
                    : JSON.stringify(log.details, null, 2)
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Auto-scroll indicator */}
      {logs.length > 10 && (
        <div className="sticky bottom-0 left-0 right-0 flex justify-center pt-2">
          <div className="bg-white/80 backdrop-blur-sm text-xs text-gray-500 px-3 py-1 rounded-full border">
            {autoScroll ? '🔄 自動スクロール中' : '⏸️ 自動スクロール停止'}
          </div>
        </div>
      )}
    </div>
  );
}
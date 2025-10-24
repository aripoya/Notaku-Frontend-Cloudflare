'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';

interface OCRStatusProps {
  jobId: string;
  status: 'queued' | 'started' | 'finished' | 'failed';
  onComplete?: () => void;
}

export default function OCRStatus({ jobId, status, onComplete }: OCRStatusProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    if (status === 'finished' || status === 'failed') {
      clearInterval(timer);
      if (status === 'finished' && onComplete) {
        onComplete();
      }
    }

    return () => clearInterval(timer);
  }, [status, onComplete]);

  const statusConfig = {
    queued: {
      icon: <Clock className="w-5 h-5" />,
      label: 'Queued',
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Waiting in queue...'
    },
    started: {
      icon: <Loader2 className="w-5 h-5 animate-spin" />,
      label: 'Processing',
      color: 'bg-blue-100 text-blue-800',
      description: 'Running OCR analysis...'
    },
    finished: {
      icon: <CheckCircle className="w-5 h-5" />,
      label: 'Complete',
      color: 'bg-green-100 text-green-800',
      description: 'Processing successful!'
    },
    failed: {
      icon: <XCircle className="w-5 h-5" />,
      label: 'Failed',
      color: 'bg-red-100 text-red-800',
      description: 'Processing failed'
    }
  };

  const config = statusConfig[status];

  return (
    <Card className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Processing Status</h3>
        <Badge className={config.color}>
          <span className="flex items-center gap-2">
            {config.icon}
            {config.label}
          </span>
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{config.description}</span>
          <span className="text-gray-500">{elapsed}s</span>
        </div>

        {(status === 'queued' || status === 'started') && (
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        )}

        <div className="text-xs text-gray-400 font-mono">
          Job ID: {jobId}
        </div>
      </div>
    </Card>
  );
}

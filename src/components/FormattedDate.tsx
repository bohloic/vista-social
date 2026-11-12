'use client';

import React, { useEffect, useState } from 'react';

interface FormattedDateProps {
  date: string | Date;
  formatType?: 'datetime' | 'date' | 'time' | 'full';
  className?: string;
}

export function FormattedDate({ date, formatType = 'datetime', className }: FormattedDateProps) {
  const [formatted, setFormatted] = useState<string>('');

  useEffect(() => {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) {
        setFormatted('');
        return;
      }

      if (formatType === 'time') {
        setFormatted(
          d.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      } else if (formatType === 'date') {
        setFormatted(
          d.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        );
      } else if (formatType === 'full') {
        setFormatted(
          d.toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      } else {
        setFormatted(
          d.toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      }
    } catch {
      setFormatted(String(date));
    }
  }, [date, formatType]);

  return (
    <span className={className} suppressHydrationWarning>
      {formatted || '...'}
    </span>
  );
}


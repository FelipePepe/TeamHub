'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TimesheetCellProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  isWeekend?: boolean;
}

export function TimesheetCell({ value, onChange, disabled = false, isWeekend = false }: TimesheetCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value > 0 ? value.toString() : '');
  }, [value]);

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseFloat(editValue) || 0;
    if (numValue !== value && numValue >= 0 && numValue <= 24) {
      onChange(numValue);
    } else {
      setEditValue(value > 0 ? value.toString() : '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value > 0 ? value.toString() : '');
      setIsEditing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setEditValue(val);
    }
  };

  return (
    <div
      className={cn(
        'flex h-10 w-16 items-center justify-center border-r border-slate-200 text-sm dark:border-slate-800 dark:text-slate-200',
        isWeekend && 'bg-slate-50 dark:bg-slate-900/60',
        !disabled && !isEditing && 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800',
        disabled && 'cursor-not-allowed opacity-50'
      )}
      onClick={handleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={editValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-8 w-14 rounded border border-blue-400 px-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-blue-500 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-500"
        />
      ) : (
        <span
          className={cn(
            value > 0
              ? 'font-medium text-slate-900 dark:text-slate-100'
              : 'text-slate-400 dark:text-slate-500'
          )}
        >
          {value > 0 ? `${value}h` : '-'}
        </span>
      )}
    </div>
  );
}

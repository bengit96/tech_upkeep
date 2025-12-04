"use client";

import { Label } from "@/components/ui/label";

interface TextAreaFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  rows?: number;
  className?: string;
}

export function TextAreaField({
  id,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  helperText,
  error,
  rows = 4,
  className = "",
}: TextAreaFieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="text-gray-200">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      {helperText && (
        <p className="text-xs text-gray-500 mb-2 mt-1">{helperText}</p>
      )}
      <textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        rows={rows}
        className={`w-full mt-2 px-3 py-2 bg-gray-900/50 border rounded-md text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-gray-700 focus:border-blue-500"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

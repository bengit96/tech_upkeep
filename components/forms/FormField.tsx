"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ReactNode } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  icon?: ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  helperText,
  error,
  icon,
  className = "",
}: FormFieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="text-gray-200">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      {helperText && (
        <p className="text-xs text-gray-500 mb-2 mt-1">{helperText}</p>
      )}
      <div className="relative mt-2">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className={`bg-gray-900/50 border-gray-700 text-gray-100 placeholder:text-gray-500 ${
            icon ? "pl-10" : ""
          } ${error ? "border-red-500 focus:border-red-500" : ""}`}
        />
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

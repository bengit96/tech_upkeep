"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HOOK_PATTERNS } from "@/lib/types/hook-patterns";

interface HookPatternSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function HookPatternSelector({
  value,
  onChange,
  className = "",
}: HookPatternSelectorProps) {
  const selectedPattern = HOOK_PATTERNS.find((p) => p.id === value);

  return (
    <div className={className}>
      <Label htmlFor="hook-pattern">Hook Style</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="hook-pattern" className="bg-gray-800 border-gray-700 text-white">
          <SelectValue placeholder="Select hook style" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700 text-white">
          {HOOK_PATTERNS.map((pattern) => (
            <SelectItem key={pattern.id} value={pattern.id} className="hover:bg-gray-700">
              <div className="flex flex-col">
                <span className="font-semibold">{pattern.name}</span>
                <span className="text-xs text-gray-400">{pattern.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Show examples for selected pattern */}
      {selectedPattern && (
        <div className="mt-2 p-3 bg-gray-700/50 rounded text-sm">
          <p className="text-gray-400 text-xs mb-2">Examples:</p>
          <ul className="space-y-1">
            {selectedPattern.examples.slice(0, 3).map((example, i) => (
              <li key={i} className="text-gray-300 text-xs">
                • {example}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

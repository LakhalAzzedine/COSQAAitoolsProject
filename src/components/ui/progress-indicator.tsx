
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  isVisible: boolean;
  message: string;
  className?: string;
}

export function ProgressIndicator({ isVisible, message, className }: ProgressIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className={cn("flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg", className)}>
      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      <span className="text-sm text-blue-800">{message}</span>
    </div>
  );
}

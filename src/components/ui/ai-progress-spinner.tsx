
import { useState, useEffect } from "react";
import { Loader2, Brain, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIProgressSpinnerProps {
  isVisible: boolean;
  messages?: string[];
  className?: string;
}

const defaultMessages = [
  "Analyzing team data...",
  "Processing Jira metrics...",
  "Extracting insights...",
  "Organizing project information...",
  "Finalizing dashboard...",
];

export function AIProgressSpinner({ isVisible, messages = defaultMessages, className }: AIProgressSpinnerProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isVisible) {
      setCurrentMessageIndex(0);
      setDots("");
      return;
    }

    // Cycle through messages
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(dotsInterval);
    };
  }, [isVisible, messages]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-4 p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50 shadow-lg backdrop-blur-sm",
      className
    )}>
      {/* Spinning brain icon with glow effect */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-lg opacity-30 animate-pulse" />
        <div className="relative bg-white dark:bg-gray-900 rounded-full p-4 shadow-lg">
          <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        
        {/* Floating sparkles */}
        <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-yellow-400 animate-bounce" />
        <Zap className="absolute -bottom-1 -left-2 w-3 h-3 text-purple-500 animate-pulse" />
      </div>

      {/* Progress message */}
      <div className="text-center space-y-2">
        <p className="text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {messages[currentMessageIndex]}{dots}
        </p>
        <p className="text-sm text-muted-foreground">
          Powered by AI ✨
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" 
               style={{ 
                 width: `${((currentMessageIndex + 1) / messages.length) * 100}%`,
                 transition: 'width 2s ease-in-out'
               }} 
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Processing...</span>
          <span>{Math.round(((currentMessageIndex + 1) / messages.length) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}

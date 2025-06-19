
import { Moon, Sun, User, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { tools } from "@/config/toolsConfig";

interface TopBarProps {
  activeSection?: string;
  selectedTool?: any;
  onToolSelect?: (tool: any) => void;
}

export function TopBar({ activeSection, selectedTool, onToolSelect }: TopBarProps) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const showQATools = activeSection === "qa-tools";

  return (
    <header className="h-12 border-b border-border bg-black backdrop-blur supports-[backdrop-filter]:bg-black/95">
      <div className="flex items-center justify-between h-full px-6">
        {/* COS QA Logo on the left */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">COS QA</h1>
          </div>
        </div>

        {/* QA Tools in the middle - only show when qa-tools is active */}
        {showQATools && (
          <div className="flex items-center space-x-2 flex-1 mx-8 overflow-x-auto">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = selectedTool?.id === tool.id;
              return (
                <div key={tool.id} className="relative">
                  <Button
                    variant={isSelected ? "secondary" : "ghost"}
                    size="sm"
                    className="flex items-center space-x-2 h-8 px-2 text-white hover:bg-gray-700 bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 whitespace-nowrap"
                    onClick={() => onToolSelect?.(tool)}
                  >
                    <div className={`w-3 h-3 ${tool.color} rounded flex items-center justify-center`}>
                      <Icon className="w-2 h-2 text-white" />
                    </div>
                    <span className="text-xs">{tool.name}</span>
                  </Button>
                  {/* Orange line for selected, grey line for unselected */}
                  <div 
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                      isSelected ? 'bg-orange-500' : 'bg-gray-600'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* User controls on the right */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 text-white hover:bg-gray-800"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
          
          <Button variant="ghost" size="icon" className="w-9 h-9 text-white hover:bg-gray-800">
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

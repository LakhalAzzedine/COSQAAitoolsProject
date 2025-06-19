
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { tools, Tool } from "@/config/toolsConfig";

interface ToolsToolbarProps {
  selectedTool: Tool | null;
  onToolSelect: (tool: Tool) => void;
}

export function ToolsToolbar({ selectedTool, onToolSelect }: ToolsToolbarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">QA AI Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = selectedTool?.id === tool.id;
            return (
              <Button
                key={tool.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="flex items-center space-x-2 h-10 px-3 bg-gray-800 text-white hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                onClick={() => onToolSelect(tool)}
              >
                <div className={`w-4 h-4 ${tool.color} rounded flex items-center justify-center`}>
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium">{tool.name}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

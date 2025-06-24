
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface KarateAutoGenerateProps {
  jiraData: any;
  isAutoGenerating: boolean;
  onAutoGenerate: () => void;
}

export function KarateAutoGenerate({ jiraData, isAutoGenerating, onAutoGenerate }: KarateAutoGenerateProps) {
  if (!jiraData) return null;

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-blue-900">Auto-Generate from JIRA</h4>
          <p className="text-sm text-blue-700">
            Automatically fetch API specs from JIRA and generate Karate scripts
          </p>
        </div>
        <Button 
          onClick={onAutoGenerate}
          disabled={isAutoGenerating}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isAutoGenerating ? (
            <Zap className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          {isAutoGenerating ? "Auto-Generating..." : "Auto-Generate Scripts"}
        </Button>
      </div>
    </div>
  );
}

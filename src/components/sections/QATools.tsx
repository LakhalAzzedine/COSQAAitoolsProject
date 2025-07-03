
import { useState, useEffect } from "react";
import { ToolsToolbar } from "./ToolsToolbar";
import { ToolContent } from "./ToolContent";
import { Tool } from "@/config/toolsConfig";
import { AIProgressSpinner } from "@/components/ui/ai-progress-spinner";

interface QAToolsProps {
  selectedTool?: Tool | null;
  onToolSelect?: (tool: Tool) => void;
}

export function QATools({ selectedTool: externalSelectedTool, onToolSelect: externalOnToolSelect }: QAToolsProps) {
  const [internalSelectedTool, setInternalSelectedTool] = useState<Tool | null>(null);
  const [importedFiles, setImportedFiles] = useState<File[]>([]);
  const [jiraStoryData, setJiraStoryData] = useState<any>(null);
  const [urlData, setUrlData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use external selectedTool if provided, otherwise use internal state
  const selectedTool = externalSelectedTool !== undefined ? externalSelectedTool : internalSelectedTool;
  const onToolSelect = externalOnToolSelect || setInternalSelectedTool;

  const selectTool = (tool: Tool) => {
    onToolSelect(tool);
  };

  const handleConfigOpen = () => {
    // This would typically open a configuration modal
    console.log('Opening configuration...');
  };

  const handleJiraStoryFetched = (data: any) => {
    setIsLoading(true);
    setTimeout(() => {
      setJiraStoryData(data);
      setIsLoading(false);
    }, 1000);
  };

  const handleUrlProcessed = (data: any) => {
    setIsLoading(true);
    setTimeout(() => {
      setUrlData(data);
      setIsLoading(false);
    }, 1000);
  };

  const handleFilesProcessed = (files: File[]) => {
    setIsLoading(true);
    setTimeout(() => {
      setImportedFiles(files);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* AI Progress Spinner */}
      <AIProgressSpinner 
        isVisible={isLoading} 
        messages={[
          "Processing your request...",
          "Analyzing data...",
          "Generating insights...",
          "Finalizing results...",
        ]}
      />

      {/* Show toolbar only if no external tool selection is provided */}
      {externalSelectedTool === undefined && !isLoading && (
        <ToolsToolbar selectedTool={selectedTool} onToolSelect={selectTool} />
      )}

      {/* Tool Content */}
      {selectedTool && selectedTool.hasSpecialLayout && !isLoading && (
        <ToolContent
          selectedTool={selectedTool}
          importedFiles={importedFiles}
          jiraStoryData={jiraStoryData}
          urlData={urlData}
          onJiraStoryFetched={handleJiraStoryFetched}
          onUrlProcessed={handleUrlProcessed}
          onFilesProcessed={handleFilesProcessed}
          onConfigOpen={handleConfigOpen}
        />
      )}
    </div>
  );
}

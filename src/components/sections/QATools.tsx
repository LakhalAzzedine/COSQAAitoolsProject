
import { useState, useEffect } from "react";
import { ToolsToolbar } from "./ToolsToolbar";
import { ToolContent } from "./ToolContent";
import { Tool } from "@/config/toolsConfig";

interface QAToolsProps {
  selectedTool?: Tool | null;
  onToolSelect?: (tool: Tool) => void;
}

export function QATools({ selectedTool: externalSelectedTool, onToolSelect: externalOnToolSelect }: QAToolsProps) {
  const [internalSelectedTool, setInternalSelectedTool] = useState<Tool | null>(null);
  const [importedFiles, setImportedFiles] = useState<File[]>([]);
  const [jiraStoryData, setJiraStoryData] = useState<any>(null);
  const [urlData, setUrlData] = useState<any>(null);

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

  return (
    <div className="space-y-6">
      {/* Show toolbar only if no external tool selection is provided */}
      {externalSelectedTool === undefined && (
        <ToolsToolbar selectedTool={selectedTool} onToolSelect={selectTool} />
      )}

      {/* Tool Content */}
      {selectedTool && selectedTool.hasSpecialLayout && (
        <ToolContent
          selectedTool={selectedTool}
          importedFiles={importedFiles}
          jiraStoryData={jiraStoryData}
          urlData={urlData}
          onJiraStoryFetched={setJiraStoryData}
          onUrlProcessed={setUrlData}
          onFilesProcessed={setImportedFiles}
          onConfigOpen={handleConfigOpen}
        />
      )}
    </div>
  );
}

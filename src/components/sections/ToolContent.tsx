
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JiraIntegration } from "./JiraIntegration";
import { UrlIntegration } from "./UrlIntegration";
import { BulkFileImport } from "./BulkFileImport";
import { QAChatbot } from "./QAChatbot";
import { XPathGenerator } from "./XPathGenerator";
import { JSONAnalyzer } from "./JSONAnalyzer";
import { TestGenerator } from "./TestGenerator";
import { Tool } from "@/config/toolsConfig";

interface ToolContentProps {
  selectedTool: Tool;
  importedFiles: File[];
  jiraStoryData: any;
  urlData: any;
  onJiraStoryFetched: (data: any) => void;
  onUrlProcessed: (data: any) => void;
  onFilesProcessed: (files: File[]) => void;
}

export function ToolContent({
  selectedTool,
  importedFiles,
  jiraStoryData,
  urlData,
  onJiraStoryFetched,
  onUrlProcessed,
  onFilesProcessed
}: ToolContentProps) {
  // Special case for chatbot
  if (selectedTool.isChatbot) {
    return <QAChatbot />;
  }

  // Special case for xpath generator
  if (selectedTool.id === "xpath-generator") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {selectedTool.useJiraIntegration && (
            <JiraIntegration onStoryFetched={onJiraStoryFetched} />
          )}
          {selectedTool.useUrlIntegration && (
            <UrlIntegration onUrlProcessed={onUrlProcessed} />
          )}
        </div>
        <XPathGenerator 
          jiraData={jiraStoryData}
          urlData={urlData}
        />
      </div>
    );
  }

  // Special case for json analyzer (removed URL integration)
  if (selectedTool.id === "json-analyzer") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {selectedTool.useJiraIntegration && (
            <JiraIntegration onStoryFetched={onJiraStoryFetched} />
          )}
        </div>
        <JSONAnalyzer 
          jiraData={jiraStoryData}
        />
      </div>
    );
  }

  // Special case for test generator
  if (selectedTool.id === "test-generator") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {selectedTool.useJiraIntegration && (
            <JiraIntegration onStoryFetched={onJiraStoryFetched} />
          )}
        </div>
        <TestGenerator 
          jiraData={jiraStoryData}
          onConfigOpen={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <div className={`w-6 h-6 ${selectedTool.color} rounded flex items-center justify-center`}>
              <selectedTool.icon className="w-4 h-4 text-white" />
            </div>
            <span>{selectedTool.name}</span>
            {jiraStoryData && selectedTool.useJiraIntegration && (
              <Badge variant="secondary">Jira: {jiraStoryData.id}</Badge>
            )}
            {urlData && selectedTool.useUrlIntegration && (
              <Badge variant="secondary">URL: {urlData.title}</Badge>
            )}
            {importedFiles.length > 0 && (
              <Badge variant="outline">{importedFiles.length} files</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{selectedTool.description}</p>
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
            <p>This tool uses automatic processing. Import your files and {selectedTool.useJiraIntegration ? 'fetch Jira data' : 'process URLs'} - no manual prompt needed!</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedTool.useJiraIntegration && (
          <JiraIntegration onStoryFetched={onJiraStoryFetched} />
        )}
        {selectedTool.useUrlIntegration && (
          <UrlIntegration onUrlProcessed={onUrlProcessed} />
        )}
        <BulkFileImport 
          onFilesProcessed={onFilesProcessed} 
          toolId={selectedTool.id}
          toolName={selectedTool.name}
          jiraData={jiraStoryData}
          urlData={urlData}
        />
      </div>
    </div>
  );
}

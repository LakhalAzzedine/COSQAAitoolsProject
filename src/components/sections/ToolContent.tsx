
import { TestGenerator } from "@/components/sections/TestGenerator";
import { ACValidator } from "@/components/sections/ACValidator";
import { XPathGenerator } from "@/components/sections/XPathGenerator";
import { JSONAnalyzer } from "@/components/sections/JSONAnalyzer";
import { AdaAnalyzer } from "@/components/sections/AdaAnalyzer";
import { Lighthouse } from "@/components/sections/Lighthouse";
import { Chatbot } from "@/components/sections/Chatbot";
import { DefectAnalyzer } from "@/components/sections/DefectAnalyzer";
import { KarateScriptWriter } from "@/components/sections/KarateScriptWriter";
import { SmartSpecScriptWriter } from "@/components/sections/SmartSpecScriptWriter";
import { Tool } from "@/config/toolsConfig";

interface ToolContentProps {
  selectedTool: Tool;
  importedFiles: File[];
  jiraStoryData: any;
  urlData: any;
  onJiraStoryFetched: (data: any) => void;
  onUrlProcessed: (data: any) => void;
  onFilesProcessed: (files: File[]) => void;
  onConfigOpen: () => void;
}

export function ToolContent({ 
  selectedTool, 
  importedFiles, 
  jiraStoryData, 
  urlData, 
  onJiraStoryFetched, 
  onUrlProcessed, 
  onFilesProcessed,
  onConfigOpen 
}: ToolContentProps) {
  switch (selectedTool.id) {
    case "test-generator":
      return (
        <TestGenerator
          jiraData={jiraStoryData}
          onJiraStoryFetched={onJiraStoryFetched}
          onFilesProcessed={onFilesProcessed}
          onConfigOpen={onConfigOpen}
        />
      );
    case "ac-validator":
      return (
        <ACValidator
          jiraData={jiraStoryData}
          onConfigOpen={onConfigOpen}
        />
      );
    case "xpath-generator":
      return (
        <XPathGenerator 
          jiraData={jiraStoryData} 
          urlData={urlData}
          onConfigOpen={onConfigOpen}
        />
      );
    case "json-analyzer":
      return (
        <JSONAnalyzer
          jiraData={jiraStoryData}
        />
      );
    case "ada-analyzer":
      return (
        <AdaAnalyzer
          jiraData={jiraStoryData}
          urlData={urlData}
          onConfigOpen={onConfigOpen}
        />
      );
    case "lighthouse":
      return (
        <Lighthouse
          jiraData={jiraStoryData}
          urlData={urlData}
          onConfigOpen={onConfigOpen}
        />
      );
    case "chatbot":
      return (
        <Chatbot
          importedFiles={importedFiles}
          jiraData={jiraStoryData}
          urlData={urlData}
          onJiraStoryFetched={onJiraStoryFetched}
          onUrlProcessed={onUrlProcessed}
          onFilesProcessed={onFilesProcessed}
          onConfigOpen={onConfigOpen}
        />
      );
    case "defect-analyzer":
      return (
        <DefectAnalyzer
          jiraData={jiraStoryData}
          onConfigOpen={onConfigOpen}
        />
      );
    case "karate-script-writer":
      return (
        <KarateScriptWriter
          jiraData={jiraStoryData}
          onConfigOpen={onConfigOpen}
        />
      );
    case "smartspec-script-writer":
      return (
        <SmartSpecScriptWriter
          jiraData={jiraStoryData}
          onConfigOpen={onConfigOpen}
        />
      );
    default:
      return <div>Tool Content Not Available</div>;
  }
}

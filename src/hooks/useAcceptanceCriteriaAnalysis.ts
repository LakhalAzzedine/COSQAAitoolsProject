
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";

export function useAcceptanceCriteriaAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const { toast } = useToast();

  const analyzeAcceptanceCriteria = async (
    jiraData: any,
    analysisType: 'test-generation' | 'validation' | 'defect-analysis',
    targetTool?: string
  ) => {
    if (!jiraData?.acceptanceCriteria || jiraData.acceptanceCriteria.length === 0) {
      toast({
        title: "No Acceptance Criteria",
        description: "Please ensure the JIRA story has acceptance criteria to analyze.",
        variant: "destructive",
      });
      return null;
    }

    setIsAnalyzing(true);
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      // Determine the appropriate tool based on analysis type or explicit target
      const toolMapping = {
        'test-generation': targetTool || 'test-generator',
        'validation': targetTool || 'ac-validator',
        'defect-analysis': targetTool || 'defect-analyzer'
      };

      const toolId = toolMapping[analysisType];
      const endpointUrl = getToolEndpointUrl(toolId, config);

      // Create enhanced prompt with acceptance criteria context
      const acContext = jiraData.acceptanceCriteria
        .map((ac: string, index: number) => `AC${index + 1}: ${ac}`)
        .join('\n');

      const analysisPrompts = {
        'test-generation': `Generate comprehensive test cases based on these acceptance criteria from JIRA story ${jiraData.key || jiraData.id}:\n\n${acContext}\n\nTitle: ${jiraData.title}\nDescription: ${jiraData.description}`,
        'validation': `Validate and analyze the quality, completeness, and testability of these acceptance criteria from JIRA story ${jiraData.key || jiraData.id}:\n\n${acContext}\n\nTitle: ${jiraData.title}\nDescription: ${jiraData.description}`,
        'defect-analysis': `Analyze potential defects, edge cases, and risks based on these acceptance criteria from JIRA story ${jiraData.key || jiraData.id}:\n\n${acContext}\n\nTitle: ${jiraData.title}\nDescription: ${jiraData.description}`
      };

      console.log(`Analyzing AC with ${toolId} for ${analysisType}`);

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: analysisPrompts[analysisType],
          jiraId: jiraData.key || jiraData.id,
          toolId: toolId,
          analysisType: analysisType,
          acceptanceCriteria: jiraData.acceptanceCriteria,
          jiraData: jiraData,
          enhancedAnalysis: true,
          context: {
            title: jiraData.title,
            description: jiraData.description,
            status: jiraData.status,
            assignee: jiraData.assignee
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setAnalysisResults(result);
      
      toast({
        title: "Analysis Complete",
        description: `${analysisType.replace('-', ' ')} completed for ${jiraData.acceptanceCriteria.length} acceptance criteria.`,
      });
      
      return result;
      
    } catch (error) {
      console.error('Error analyzing acceptance criteria:', error);
      toast({
        title: "Analysis Failed",
        description: `Could not complete ${analysisType.replace('-', ' ')}. Check configuration.`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearResults = () => {
    setAnalysisResults(null);
  };

  return {
    isAnalyzing,
    analysisResults,
    analyzeAcceptanceCriteria,
    clearResults
  };
}

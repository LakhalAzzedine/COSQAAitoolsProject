
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Download, Brain, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { defaultEndpointConfig, getToolEndpointUrl } from "@/config/backendConfig";

interface JiraIntegrationProps {
  onStoryFetched: (storyData: any) => void;
}

export function JiraIntegration({ onStoryFetched }: JiraIntegrationProps) {
  const [jiraStoryId, setJiraStoryId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedStory, setFetchedStory] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // Enhanced function to extract acceptance criteria from various JIRA fields
  const extractAcceptanceCriteria = (jiraData: any) => {
    const criteria: string[] = [];
    
    // Check various possible fields where AC might be stored
    if (jiraData.fields) {
      // Common custom field names for acceptance criteria
      const acFields = [
        'customfield_10000', // Common AC field
        'customfield_10001',
        'customfield_10002',
        'acceptanceCriteria',
        'acceptance_criteria',
        'customfield_12345' // Add more based on your JIRA setup
      ];
      
      acFields.forEach(field => {
        if (jiraData.fields[field]) {
          const value = jiraData.fields[field];
          if (typeof value === 'string') {
            // Split by common delimiters
            const splitCriteria = value.split(/\n|;|\*|-/).filter(c => c.trim().length > 0);
            criteria.push(...splitCriteria.map(c => c.trim()));
          } else if (Array.isArray(value)) {
            criteria.push(...value.map(v => v.toString().trim()));
          }
        }
      });
      
      // Also check description for AC patterns
      if (jiraData.fields.description) {
        const desc = jiraData.fields.description;
        // Look for patterns like "AC:", "Acceptance Criteria:", "Given/When/Then"
        const acPatterns = [
          /AC[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
          /Acceptance Criteria[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
          /Given.*?When.*?Then.*?(?=\n\n|\n[A-Z]|$)/gis
        ];
        
        acPatterns.forEach(pattern => {
          const matches = desc.match(pattern);
          if (matches) {
            criteria.push(...matches.map(m => m.trim()));
          }
        });
      }
    }
    
    return criteria.length > 0 ? criteria : null;
  };

  const handleFetchStory = async () => {
    if (!jiraStoryId.trim()) return;
    
    setIsLoading(true);
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("jira-integration", config);
      console.log(`Fetching Jira story: ${jiraStoryId} from ${endpointUrl}`);
      
      const response = await fetch(`${endpointUrl}?jiraId=${encodeURIComponent(jiraStoryId.trim())}&action=fetchStory&includeAcceptanceCriteria=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const rawJiraData = await response.json();
      
      // Enhanced extraction of acceptance criteria
      const extractedAC = extractAcceptanceCriteria(rawJiraData);
      
      const storyData = {
        id: jiraStoryId,
        key: rawJiraData.key || jiraStoryId,
        title: rawJiraData.fields?.summary || rawJiraData.title || rawJiraData.summary,
        description: rawJiraData.fields?.description || rawJiraData.description || '',
        status: rawJiraData.fields?.status?.name || rawJiraData.status || 'Unknown',
        assignee: rawJiraData.fields?.assignee?.displayName || rawJiraData.assignee || 'Unassigned',
        acceptanceCriteria: extractedAC || [],
        rawData: rawJiraData // Keep original data for reference
      };
      
      setFetchedStory(storyData);
      onStoryFetched(storyData);
      
      toast({
        title: "Story Fetched Successfully",
        description: `Fetched ${jiraStoryId} with ${storyData.acceptanceCriteria.length} acceptance criteria`,
      });
      
    } catch (error) {
      console.error('Error fetching Jira story:', error);
      toast({
        title: "Error",
        description: "Could not fetch Jira story. Check SVC cluster configuration and connectivity.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced function to send AC to LLM with specific analysis request
  const analyzeWithLLM = async (analysisType: 'test-cases' | 'validation' | 'defect-analysis') => {
    if (!fetchedStory || !fetchedStory.acceptanceCriteria || fetchedStory.acceptanceCriteria.length === 0) {
      toast({
        title: "Error",
        description: "No acceptance criteria available for analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      // Determine the appropriate tool endpoint based on analysis type
      const toolEndpoints = {
        'test-cases': 'test-generator',
        'validation': 'ac-validator',
        'defect-analysis': 'defect-analyzer'
      };

      const endpointUrl = getToolEndpointUrl(toolEndpoints[analysisType], config);
      
      const analysisPrompts = {
        'test-cases': `Generate comprehensive test cases based on the following acceptance criteria from JIRA story ${fetchedStory.key}`,
        'validation': `Validate and analyze the quality of the following acceptance criteria from JIRA story ${fetchedStory.key}`,
        'defect-analysis': `Analyze potential defects and risks based on the following acceptance criteria from JIRA story ${fetchedStory.key}`
      };

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jiraId: fetchedStory.key,
          toolId: toolEndpoints[analysisType],
          analysisType: analysisType,
          acceptanceCriteria: fetchedStory.acceptanceCriteria,
          title: fetchedStory.title,
          description: fetchedStory.description,
          prompt: `${analysisPrompts[analysisType]}:\n\nTitle: ${fetchedStory.title}\n\nDescription: ${fetchedStory.description}\n\nAcceptance Criteria:\n${fetchedStory.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}`
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast({
        title: "Analysis Complete",
        description: `${analysisType === 'test-cases' ? 'Test cases generated' : analysisType === 'validation' ? 'AC validation completed' : 'Defect analysis completed'} successfully.`,
      });
      
      return result;
      
    } catch (error) {
      console.error('Error analyzing with LLM:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not complete LLM analysis. Check configuration.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ExternalLink className="w-5 h-5" />
          <span>Enhanced Jira Integration</span>
          <Badge variant="outline" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            AI Enhanced
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="jira-story-id">Jira Story ID</Label>
          <div className="flex space-x-2">
            <Input
              id="jira-story-id"
              placeholder="e.g., PROJ-123"
              value={jiraStoryId}
              onChange={(e) => setJiraStoryId(e.target.value)}
            />
            <Button 
              onClick={handleFetchStory}
              disabled={!jiraStoryId.trim() || isLoading}
            >
              {isLoading ? <Download className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isLoading ? "Fetching..." : "Fetch"}
            </Button>
          </div>
        </div>

        {fetchedStory && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{fetchedStory.title}</h4>
              <div className="flex items-center space-x-2">
                <Badge>{fetchedStory.status}</Badge>
                {fetchedStory.acceptanceCriteria.length > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {fetchedStory.acceptanceCriteria.length} AC Found
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">{fetchedStory.description}</p>
            
            {fetchedStory.acceptanceCriteria && fetchedStory.acceptanceCriteria.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2 flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Extracted Acceptance Criteria:</span>
                </h5>
                <ul className="space-y-2">
                  {fetchedStory.acceptanceCriteria.map((ac: string, index: number) => (
                    <li key={index} className="text-sm pl-3 py-2 border-l-3 border-orange-500 bg-orange-50 dark:bg-orange-900/20 rounded-r">
                      <span className="font-medium text-orange-700 dark:text-orange-400">AC{index + 1}:</span> {ac}
                    </li>
                  ))}
                </ul>
                
                {/* AI Analysis Buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    onClick={() => analyzeWithLLM('test-cases')}
                    disabled={isAnalyzing}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {isAnalyzing ? "Analyzing..." : "Generate Test Cases"}
                  </Button>
                  
                  <Button
                    onClick={() => analyzeWithLLM('validation')}
                    disabled={isAnalyzing}
                    size="sm"
                    variant="outline"
                    className="border-green-500 text-green-700 hover:bg-green-50 dark:border-green-400 dark:text-green-400"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    {isAnalyzing ? "Validating..." : "Validate AC"}
                  </Button>
                  
                  <Button
                    onClick={() => analyzeWithLLM('defect-analysis')}
                    disabled={isAnalyzing}
                    size="sm"
                    variant="outline"
                    className="border-red-500 text-red-700 hover:bg-red-50 dark:border-red-400 dark:text-red-400"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {isAnalyzing ? "Analyzing..." : "Analyze Defects"}
                  </Button>
                </div>
              </div>
            )}
            
            {fetchedStory.assignee && (
              <p className="text-sm">
                <span className="font-medium">Assignee:</span> {fetchedStory.assignee}
              </p>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>Enhanced JIRA integration with AI-powered acceptance criteria extraction and analysis.</p>
        </div>
      </CardContent>
    </Card>
  );
}

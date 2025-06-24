import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileCode, Zap, Download, FileText, Send, Eye } from "lucide-react";
import { InfoPopover } from "@/components/ui/info-popover";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl, buildPromptWithContext } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";

interface TestGeneratorProps {
  jiraData?: any;
  onConfigOpen: () => void;
}

export function TestGenerator({ jiraData, onConfigOpen }: TestGeneratorProps) {
  const [jiraStoryId, setJiraStoryId] = useState("");
  const [testRequirements, setTestRequirements] = useState("");
  const [generatedTests, setGeneratedTests] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingJira, setIsCreatingJira] = useState(false);
  const { toast } = useToast();

  const handleGenerateTests = async () => {
    if (!jiraStoryId.trim() && !testRequirements.trim()) {
      toast({
        title: "Error",
        description: "Please enter a JIRA Story ID or test requirements.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      let enhancedJiraData = null;
      
      // If we have a JIRA story ID, fetch the story details first
      if (jiraStoryId.trim()) {
        const jiraEndpointUrl = getToolEndpointUrl("jira-integration", config);
        
        console.log(`Fetching JIRA story details for: ${jiraStoryId}`);
        
        const jiraResponse = await fetch(jiraEndpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: "fetchStory",
            jiraId: jiraStoryId,
            toolId: "test-generator"
          })
        });
        
        if (!jiraResponse.ok) {
          throw new Error(`JIRA API error! status: ${jiraResponse.status}`);
        }
        
        const jiraResult = await jiraResponse.json();
        
        enhancedJiraData = {
          id: jiraStoryId,
          title: jiraResult.title || jiraResult.summary || `Story ${jiraStoryId}`,
          description: jiraResult.description || '',
          acceptanceCriteria: jiraResult.acceptanceCriteria || []
        };
      }

      // Generate test cases using the test generator endpoint
      const endpointUrl = getToolEndpointUrl("test-generator", config);
      
      const contentToAnalyze = testRequirements || 
        (enhancedJiraData ? `${enhancedJiraData.title}\n\n${enhancedJiraData.description}` : '');
      
      const prompt = buildPromptWithContext("test-generator", contentToAnalyze, enhancedJiraData);
      
      console.log(`Generating test cases via ${endpointUrl}`);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          requirements: contentToAnalyze,
          toolId: "test-generator",
          jiraId: jiraStoryId || '',
          jiraData: enhancedJiraData
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Test generation response:", result);
      
      const testsText = result.response || result.tests || result.data?.response || result.data?.tests || "No test cases generated";
      
      setGeneratedTests(testsText);
      
      toast({
        title: "Test Cases Generated",
        description: jiraStoryId ? `Test cases generated for JIRA story ${jiraStoryId}` : "Test cases have been generated successfully",
      });
      
    } catch (error) {
      console.error('Error generating test cases:', error);
      toast({
        title: "Error",
        description: "Could not generate test cases. Check your backend configuration and connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportTests = (format: 'txt' | 'json') => {
    if (!generatedTests) {
      toast({
        title: "Error",
        description: "Please generate test cases first.",
        variant: "destructive",
      });
      return;
    }

    let content: string;
    let mimeType: string;
    let filename: string;

    if (format === 'json') {
      const exportData = {
        timestamp: new Date().toISOString(),
        jiraStoryId: jiraStoryId,
        testRequirements: testRequirements,
        generatedTests: generatedTests,
        jiraData: jiraData
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `test-cases-${Date.now()}.json`;
    } else {
      content = `Test Cases Generated on: ${new Date().toLocaleString()}\n\nJIRA Story ID: ${jiraStoryId}\nTest Requirements: ${testRequirements}\n\nGenerated Test Cases:\n${generatedTests}`;
      mimeType = 'text/plain';
      filename = `test-cases-${Date.now()}.txt`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Test cases exported as ${format.toUpperCase()} file`,
    });
  };

  const createJiraTicket = async () => {
    if (!generatedTests) {
      toast({
        title: "Error",
        description: "Please generate test cases first.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingJira(true);
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("jira-integration", config);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: "createTicket",
          tests: generatedTests,
          jiraId: jiraData?.id || jiraData?.key || jiraStoryId,
          toolId: "test-generator"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast({
        title: "Jira Ticket Created",
        description: `Test cases ticket created in Jira: ${result.issueKey || 'Success'}`,
      });
      
    } catch (error) {
      console.error('Error creating Jira ticket:', error);
      toast({
        title: "Error",
        description: "Could not create ticket in Jira. Check configuration.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingJira(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
                <FileCode className="w-4 h-4 text-white" />
              </div>
              <span>Test Generator</span>
              {jiraData && (
                <Badge variant="secondary">Jira: {jiraData.id}</Badge>
              )}
            </div>
            <InfoPopover
              title="How to use Test Generator"
              content="Generate comprehensive test cases from JIRA stories or manual requirements."
              steps={[
                "Enter a JIRA Story ID or write test requirements manually",
                "Click 'Generate Tests' to create test cases",
                "Review and export the generated test cases",
                "Create JIRA tickets or download as files"
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Generate comprehensive test cases from JIRA stories or custom requirements.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jira-story-id">JIRA Story ID</Label>
              <Input
                id="jira-story-id"
                placeholder="Enter JIRA Story ID (e.g., PROJ-123)"
                value={jiraStoryId}
                onChange={(e) => setJiraStoryId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-requirements">Test Requirements (Optional)</Label>
              <Textarea
                id="test-requirements"
                placeholder="Describe what you want to test..."
                value={testRequirements}
                onChange={(e) => setTestRequirements(e.target.value)}
                rows={4}
              />
            </div>
            
            <Button 
              onClick={handleGenerateTests}
              disabled={(!jiraStoryId.trim() && !testRequirements.trim()) || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Zap className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Generating..." : "Generate Tests"}
            </Button>

            {generatedTests && (
              <div className="space-y-2">
                <Label>Generated Test Cases</Label>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">{generatedTests}</pre>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => exportTests('txt')} variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Export TXT
                  </Button>
                  <Button onClick={() => exportTests('json')} variant="outline" className="flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button 
                    onClick={createJiraTicket}
                    disabled={isCreatingJira}
                    variant="outline" 
                    className="flex-1"
                  >
                    {isCreatingJira ? (
                      <Send className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {isCreatingJira ? "Creating..." : "Create in Jira"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

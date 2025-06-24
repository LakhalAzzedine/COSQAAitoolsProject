import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Zap, AlertTriangle, FileText, Download, Send } from "lucide-react";
import { InfoPopover } from "@/components/ui/info-popover";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl, buildPromptWithContext } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";

interface ACValidatorProps {
  jiraData?: any;
  onConfigOpen: () => void;
}

export function ACValidator({ jiraData, onConfigOpen }: ACValidatorProps) {
  const [jiraStoryId, setJiraStoryId] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [validationResult, setValidationResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingJira, setIsUpdatingJira] = useState(false);
  const { toast } = useToast();

  const handleValidate = async () => {
    if (!jiraStoryId.trim() && !acceptanceCriteria.trim()) {
      toast({
        title: "Error",
        description: "Please enter a JIRA Story ID or acceptance criteria.",
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
            toolId: "ac-validator"
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

      // Generate validation using the AC validator endpoint
      const endpointUrl = getToolEndpointUrl("ac-validator", config);
      
      const contentToAnalyze = acceptanceCriteria || 
        (enhancedJiraData ? enhancedJiraData.acceptanceCriteria.join('\n') : '');
      
      const prompt = buildPromptWithContext("ac-validator", contentToAnalyze, enhancedJiraData);
      
      console.log(`Validating AC via ${endpointUrl}`);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          acceptanceCriteria: contentToAnalyze,
          toolId: "ac-validator",
          jiraId: jiraStoryId || '',
          jiraData: enhancedJiraData
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("AC validation response:", result);
      
      const validationText = result.response || result.validation || result.data?.response || result.data?.validation || "No validation results generated";
      
      setValidationResult(validationText);
      
      toast({
        title: "AC Validation Complete",
        description: jiraStoryId ? `AC validated for JIRA story ${jiraStoryId}` : "Acceptance criteria validation completed",
      });
      
    } catch (error) {
      console.error('Error validating AC:', error);
      toast({
        title: "Error",
        description: "Could not validate acceptance criteria. Check your backend configuration and connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = (format: 'txt' | 'json') => {
    if (!validationResult) {
      toast({
        title: "Error",
        description: "Please validate acceptance criteria first.",
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
        acceptanceCriteria: acceptanceCriteria,
        validationResult: validationResult,
        jiraData: jiraData
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `ac-validation-${Date.now()}.json`;
    } else {
      content = `AC Validation Report Generated on: ${new Date().toLocaleString()}\n\nJIRA Story ID: ${jiraStoryId}\nAcceptance Criteria: ${acceptanceCriteria}\n\nValidation Results:\n${validationResult}`;
      mimeType = 'text/plain';
      filename = `ac-validation-${Date.now()}.txt`;
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
      description: `AC validation report exported as ${format.toUpperCase()} file`,
    });
  };

  const updateJira = async () => {
    if (!validationResult) {
      toast({
        title: "Error",
        description: "Please validate acceptance criteria first.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingJira(true);
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
          action: "updateTicket",
          validation: validationResult,
          jiraId: jiraData?.id || jiraData?.key || jiraStoryId,
          toolId: "ac-validator"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast({
        title: "Jira Updated",
        description: `AC validation results updated in Jira: ${result.issueKey || 'Success'}`,
      });
      
    } catch (error) {
      console.error('Error updating Jira:', error);
      toast({
        title: "Error",
        description: "Could not update Jira. Check configuration.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingJira(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span>AC Validator</span>
              {jiraData && (
                <Badge variant="secondary">Jira: {jiraData.id}</Badge>
              )}
            </div>
            <InfoPopover
              title="How to use AC Validator"
              content="Validate and improve acceptance criteria quality for better testing outcomes."
              steps={[
                "Enter a JIRA Story ID or paste acceptance criteria manually",
                "Click 'Validate AC' to analyze the criteria",
                "Review validation results and suggestions",
                "Export improved criteria or update JIRA directly"
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Validate and improve acceptance criteria quality for better testing outcomes.
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
              <Label htmlFor="acceptance-criteria">Acceptance Criteria (Optional)</Label>
              <Textarea
                id="acceptance-criteria"
                placeholder="Paste acceptance criteria to validate..."
                value={acceptanceCriteria}
                onChange={(e) => setAcceptanceCriteria(e.target.value)}
                rows={6}
              />
            </div>
            
            <Button 
              onClick={handleValidate}
              disabled={(!jiraStoryId.trim() && !acceptanceCriteria.trim()) || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Zap className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Validating..." : "Validate AC"}
            </Button>

            {validationResult && (
              <div className="space-y-2">
                <Label>Validation Results</Label>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">{validationResult}</pre>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => exportReport('txt')} variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Export TXT
                  </Button>
                  <Button onClick={() => exportReport('json')} variant="outline" className="flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button 
                    onClick={updateJira}
                    disabled={isUpdatingJira}
                    variant="outline" 
                    className="flex-1"
                  >
                    {isUpdatingJira ? (
                      <Send className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 mr-2" />
                    )}
                    {isUpdatingJira ? "Updating..." : "Update Jira"}
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

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accessibility, Zap, Download, Eye, Send, AlertCircle, CheckCircle, TestTube } from "lucide-react";
import { InfoPopover } from "@/components/ui/info-popover";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";
import { useQTestIntegration } from "@/hooks/useQTestIntegration";

interface AdaAnalyzerProps {
  jiraData?: any;
  urlData?: any;
  onConfigOpen: () => void;
}

export function AdaAnalyzer({ jiraData, urlData, onConfigOpen }: AdaAnalyzerProps) {
  const [url, setUrl] = useState(urlData?.url || "");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingJira, setIsCreatingJira] = useState(false);
  const { toast } = useToast();
  const { isCreatingQTest, createInQTest } = useQTestIntegration();

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please provide a URL to analyze.",
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

      const endpointUrl = getToolEndpointUrl("ada-analyzer", config);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          jiraId: jiraData?.id || jiraData?.key || '',
          context: jiraData ? `Jira Story: ${jiraData.summary || jiraData.title || ''}` : '',
          toolId: "ada-analyzer"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setAnalysisResult(result);
      
      toast({
        title: "Analysis Complete",
        description: "ADA accessibility analysis has been completed successfully.",
      });
    } catch (error) {
      console.error('Error analyzing accessibility:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze accessibility. Check configuration and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    if (!analysisResult) {
      toast({
        title: "Error",
        description: "Please analyze accessibility first.",
        variant: "destructive",
      });
      return;
    }

    const content = JSON.stringify(analysisResult, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ada-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "ADA analysis exported successfully",
    });
  };

  const createInQTestHandler = async () => {
    if (!analysisResult) {
      toast({
        title: "Error",
        description: "Please analyze accessibility first.",
        variant: "destructive",
      });
      return;
    }

    const analysisData = {
      analysis: analysisResult,
      url: url,
      jiraData: jiraData,
      timestamp: new Date().toISOString()
    };
    
    await createInQTest(analysisData, "ada-analyzer", "accessibility analysis");
  };

  const generateTests = async () => {
    if (!analysisResult) {
      toast({
        title: "Error",
        description: "Please analyze accessibility first.",
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
          analysis: analysisResult,
          url: url,
          jiraId: jiraData?.id || jiraData?.key || '',
          toolId: "ada-analyzer"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast({
        title: "Test Scenarios Created",
        description: `Accessibility test scenarios created in Jira: ${result.issueKey || 'Success'}`,
      });
      
    } catch (error) {
      console.error('Error creating test scenarios:', error);
      toast({
        title: "Error",
        description: "Could not create test scenarios in Jira. Check configuration.",
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
              <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">
                <Accessibility className="w-4 h-4 text-white" />
              </div>
              <span>ADA Analyzer</span>
              {jiraData && (
                <Badge variant="secondary">Jira: {jiraData.id}</Badge>
              )}
            </div>
            <InfoPopover
              title="How to use ADA Analyzer"
              content="Comprehensive accessibility analysis tool for ADA compliance checking."
              steps={[
                "Enter the URL you want to analyze for accessibility",
                "Click 'Analyze Accessibility' to run the analysis",
                "Review the detailed accessibility report",
                "Export the report or generate test scenarios in Jira"
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Analyze web pages for ADA compliance and accessibility best practices.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url-input">Website URL</Label>
              <Input
                id="url-input"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleAnalyze}
              disabled={!url.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Zap className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Accessibility className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Analyzing..." : "Analyze Accessibility"}
            </Button>

            {analysisResult && (
              <div className="space-y-4">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="issues">Issues</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <div>
                              <p className="text-sm font-medium">Passed</p>
                              <p className="text-2xl font-bold">{analysisResult.passed || 0}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <div>
                              <p className="text-sm font-medium">Violations</p>
                              <p className="text-2xl font-bold">{analysisResult.violations || 0}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Eye className="w-4 h-4 text-yellow-500" />
                            <div>
                              <p className="text-sm font-medium">Incomplete</p>
                              <p className="text-2xl font-bold">{analysisResult.incomplete || 0}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="issues" className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-60">
                          {JSON.stringify(analysisResult.issues || [], null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="recommendations" className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-60">
                          {JSON.stringify(analysisResult.recommendations || [], null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
                
                <div className="flex gap-2">
                  <Button onClick={exportReport} variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                  <Button 
                    onClick={createInQTestHandler}
                    disabled={isCreatingQTest}
                    variant="outline" 
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  >
                    {isCreatingQTest ? (
                      <TestTube className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4 mr-2" />
                    )}
                    {isCreatingQTest ? "Creating..." : "Create in QTest"}
                  </Button>
                  <Button 
                    onClick={generateTests}
                    disabled={isCreatingJira}
                    variant="outline" 
                    className="flex-1"
                  >
                    {isCreatingJira ? (
                      <Send className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    {isCreatingJira ? "Creating..." : "Generate Tests"}
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

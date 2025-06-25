
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gauge, Zap, Download, Eye, Send, TrendingUp } from "lucide-react";
import { InfoPopover } from "@/components/ui/info-popover";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";

interface LighthouseProps {
  jiraData?: any;
  urlData?: any;
  onConfigOpen: () => void;
}

export function Lighthouse({ jiraData, urlData, onConfigOpen }: LighthouseProps) {
  const [url, setUrl] = useState(urlData?.url || "");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingJira, setIsCreatingJira] = useState(false);
  const { toast } = useToast();

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

      const endpointUrl = getToolEndpointUrl("lighthouse", config);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          jiraId: jiraData?.id || jiraData?.key || '',
          context: jiraData ? `Jira Story: ${jiraData.summary || jiraData.title || ''}` : '',
          toolId: "lighthouse"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setAnalysisResult(result);
      
      toast({
        title: "Analysis Complete",
        description: "Lighthouse performance analysis has been completed successfully.",
      });
    } catch (error) {
      console.error('Error running Lighthouse analysis:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not run Lighthouse analysis. Check configuration and try again.",
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
        description: "Please run Lighthouse analysis first.",
        variant: "destructive",
      });
      return;
    }

    const content = JSON.stringify(analysisResult, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lighthouse-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Lighthouse report exported successfully",
    });
  };

  const generateTests = async () => {
    if (!analysisResult) {
      toast({
        title: "Error",
        description: "Please run Lighthouse analysis first.",
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
          toolId: "lighthouse"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast({
        title: "Test Scenarios Created",
        description: `Performance test scenarios created in Jira: ${result.issueKey || 'Success'}`,
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center">
                <Gauge className="w-4 h-4 text-white" />
              </div>
              <span>Lighthouse</span>
              {jiraData && (
                <Badge variant="secondary">Jira: {jiraData.id}</Badge>
              )}
            </div>
            <InfoPopover
              title="How to use Lighthouse"
              content="Performance and quality analysis tool using Google Lighthouse."
              steps={[
                "Enter the URL you want to analyze",
                "Click 'Run Lighthouse' to start the analysis",
                "Review performance, accessibility, best practices, and SEO scores",
                "Export the report or generate test scenarios in Jira"
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Comprehensive web page analysis for performance, accessibility, best practices, and SEO.
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
                <Gauge className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Running Analysis..." : "Run Lighthouse"}
            </Button>

            {analysisResult && (
              <div className="space-y-4">
                <Tabs defaultValue="scores" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="scores">Scores</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                    <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                  </TabsList>

                  <TabsContent value="scores" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium">Performance</p>
                              <p className={`text-2xl font-bold ${getScoreColor(analysisResult.performance || 0)}`}>
                                {analysisResult.performance || 0}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Eye className="w-4 h-4 text-green-500" />
                            <div>
                              <p className="text-sm font-medium">Accessibility</p>
                              <p className={`text-2xl font-bold ${getScoreColor(analysisResult.accessibility || 0)}`}>
                                {analysisResult.accessibility || 0}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Gauge className="w-4 h-4 text-purple-500" />
                            <div>
                              <p className="text-sm font-medium">Best Practices</p>
                              <p className={`text-2xl font-bold ${getScoreColor(analysisResult.bestPractices || 0)}`}>
                                {analysisResult.bestPractices || 0}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="text-sm font-medium">SEO</p>
                              <p className={`text-2xl font-bold ${getScoreColor(analysisResult.seo || 0)}`}>
                                {analysisResult.seo || 0}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="metrics" className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-60">
                          {JSON.stringify(analysisResult.metrics || {}, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="opportunities" className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-60">
                          {JSON.stringify(analysisResult.opportunities || [], null, 2)}
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

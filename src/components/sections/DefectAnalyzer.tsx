
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Bug, Zap, TrendingUp, FileText, Download, Send, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { InfoPopover } from "@/components/ui/info-popover";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl, buildPromptWithContext } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";
import { DefectAnalyzer as DefectUtil, defectPreventionBestPractices, RootCauseAnalysis } from "@/utils/defectAnalysisUtils";

interface DefectAnalyzerProps {
  jiraData?: any;
  onConfigOpen: () => void;
}

export function DefectAnalyzer({ jiraData, onConfigOpen }: DefectAnalyzerProps) {
  const [jiraTicketId, setJiraTicketId] = useState("");
  const [defectDescription, setDefectDescription] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState<RootCauseAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingJira, setIsUpdatingJira] = useState(false);
  const { toast } = useToast();

  const defectUtil = new DefectUtil();

  const handleAnalyze = async () => {
    if (!jiraTicketId.trim() && !defectDescription.trim()) {
      toast({
        title: "Error",
        description: "Please enter a JIRA ticket ID or defect description.",
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
      
      // If we have a JIRA ticket ID, fetch the ticket details first
      if (jiraTicketId.trim()) {
        const jiraEndpointUrl = getToolEndpointUrl("jira-integration", config);
        
        console.log(`Fetching JIRA ticket details for: ${jiraTicketId}`);
        
        try {
          const jiraResponse = await fetch(jiraEndpointUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: "fetchStory",
              jiraId: jiraTicketId,
              toolId: "defect-analyzer"
            })
          });
          
          if (jiraResponse.ok) {
            const jiraResult = await jiraResponse.json();
            
            enhancedJiraData = {
              id: jiraTicketId,
              title: jiraResult.title || jiraResult.summary || `Ticket ${jiraTicketId}`,
              description: jiraResult.description || '',
              priority: jiraResult.priority || 'Medium',
              defectDetails: jiraResult.defectDetails || []
            };
          }
        } catch (error) {
          console.log('JIRA fetch failed, proceeding with local analysis');
        }
      }

      // Perform local root cause analysis first
      const contentToAnalyze = defectDescription || 
        (enhancedJiraData ? `${enhancedJiraData.title}\n\n${enhancedJiraData.description}` : '');
      
      const localAnalysis = defectUtil.analyzeDefect(contentToAnalyze, enhancedJiraData);
      setRootCauseAnalysis(localAnalysis);

      // Generate comprehensive report
      const report = defectUtil.generateDefectReport(localAnalysis, contentToAnalyze, jiraTicketId);
      setAnalysisResult(report);

      // Try to enhance with backend analysis
      try {
        const endpointUrl = getToolEndpointUrl("defect-analyzer", config);
        const prompt = buildPromptWithContext("defect-analyzer", contentToAnalyze, enhancedJiraData);
        
        console.log(`Enhancing defect analysis via ${endpointUrl}`);
        
        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            defectDescription: contentToAnalyze,
            toolId: "defect-analyzer",
            jiraId: jiraTicketId || '',
            jiraData: enhancedJiraData,
            localAnalysis: localAnalysis
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          const backendAnalysis = result.response || result.analysis || result.data?.response || result.data?.analysis;
          
          if (backendAnalysis) {
            // Enhance the report with backend insights
            const enhancedReport = report + '\n\n## AI-Enhanced Insights\n' + backendAnalysis;
            setAnalysisResult(enhancedReport);
          }
        }
      } catch (error) {
        console.log('Backend enhancement failed, using local analysis only');
      }
      
      toast({
        title: "Defect Analysis Complete",
        description: jiraTicketId ? `Defect analyzed for JIRA ticket ${jiraTicketId}` : "Defect analysis completed successfully",
      });
      
    } catch (error) {
      console.error('Error analyzing defect:', error);
      toast({
        title: "Error",
        description: "Could not analyze defect. Check your backend configuration and connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalysis = (format: 'txt' | 'json' | 'pdf') => {
    if (!analysisResult) {
      toast({
        title: "Error",
        description: "Please analyze defect first.",
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
        jiraTicketId: jiraTicketId,
        defectDescription: defectDescription,
        analysisResult: analysisResult,
        rootCauseAnalysis: rootCauseAnalysis,
        bestPractices: defectPreventionBestPractices,
        jiraData: jiraData
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `defect-analysis-${Date.now()}.json`;
    } else {
      content = analysisResult;
      mimeType = 'text/plain';
      filename = `defect-analysis-${Date.now()}.txt`;
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
      description: `Defect analysis exported as ${format.toUpperCase()} file`,
    });
  };

  const updateJira = async () => {
    if (!analysisResult) {
      toast({
        title: "Error",
        description: "Please analyze defect first.",
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
          analysis: analysisResult,
          jiraId: jiraData?.id || jiraData?.key || jiraTicketId,
          toolId: "defect-analyzer"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast({
        title: "Jira Updated",
        description: `Defect analysis updated in Jira: ${result.issueKey || 'Success'}`,
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

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                <Bug className="w-4 h-4 text-white" />
              </div>
              <span>🚀 Advanced Defect Analyzer</span>
              {jiraData && (
                <Badge variant="secondary">Jira: {jiraData.id}</Badge>
              )}
            </div>
            <InfoPopover
              title="Advanced Defect Analyzer"
              content="Comprehensive defect analysis with root cause identification and prevention strategies."
              steps={[
                "Enter a JIRA defect ticket ID or describe the defect manually",
                "Click 'Analyze Defect' to start comprehensive analysis",
                "Review root cause analysis and recommendations",
                "Export detailed report or update JIRA with findings"
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            🔧 Comprehensive defect analysis with root cause identification, impact assessment, and prevention strategies.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jira-ticket-id">JIRA Defect Ticket ID</Label>
              <Input
                id="jira-ticket-id"
                placeholder="Enter JIRA Ticket ID (e.g., BUG-123)"
                value={jiraTicketId}
                onChange={(e) => setJiraTicketId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defect-description">Defect Description (Optional)</Label>
              <Textarea
                id="defect-description"
                placeholder="Describe the defect, steps to reproduce, expected vs actual behavior..."
                value={defectDescription}
                onChange={(e) => setDefectDescription(e.target.value)}
                rows={6}
              />
            </div>
            
            <Button 
              onClick={handleAnalyze}
              disabled={(!jiraTicketId.trim() && !defectDescription.trim()) || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Zap className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bug className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Analyzing..." : "🎯 Analyze Defect"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {rootCauseAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>📊 Root Cause Analysis Dashboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="prevention">Prevention</TabsTrigger>
                <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(rootCauseAnalysis.severity)}>
                          {rootCauseAnalysis.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">🎯 Severity Level</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="text-lg font-semibold">{rootCauseAnalysis.category}</div>
                      <p className="text-sm text-gray-600">📋 Defect Category</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-4">
                      <div className="text-lg font-semibold">{rootCauseAnalysis.impactAreas.length}</div>
                      <p className="text-sm text-gray-600">⚡ Impact Areas</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="text-lg font-semibold">{rootCauseAnalysis.recommendedActions.length}</div>
                      <p className="text-sm text-gray-600">✅ Recommended Actions</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">🔍 Primary Root Cause</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                      <p className="text-gray-700">{rootCauseAnalysis.primaryCause}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analysis" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">⚡ Contributing Factors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {rootCauseAnalysis.contributingFactors.map((factor, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <span className="flex-shrink-0 w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                              {index + 1}
                            </span>
                            <p className="text-sm text-gray-700">{factor}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">🎯 Impact Areas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {rootCauseAnalysis.impactAreas.map((area, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-700">{area}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">🔧 Testing Gaps Identified</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {rootCauseAnalysis.testingGaps.map((gap, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 rounded">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                          <p className="text-sm text-red-700">{gap}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="prevention" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">🛡️ Prevention Measures</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {rootCauseAnalysis.preventionMeasures.map((measure, index) => (
                          <div key={index} className="flex items-start space-x-2 p-2 bg-green-50 rounded">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                            <p className="text-sm text-green-700">{measure}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">✅ Recommended Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {rootCauseAnalysis.recommendedActions.map((action, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                              {index + 1}
                            </span>
                            <p className="text-sm text-gray-700">{action}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="best-practices" className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">📚 Defect Prevention Best Practices</h3>
                  {defectPreventionBestPractices.map((practice, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-gray-50 rounded">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-sm text-gray-700">{practice}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            {analysisResult && (
              <div className="mt-6 flex gap-2">
                <Button onClick={() => exportAnalysis('txt')} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Export TXT
                </Button>
                <Button onClick={() => exportAnalysis('json')} variant="outline" className="flex-1">
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
                    <TrendingUp className="w-4 h-4 mr-2" />
                  )}
                  {isUpdatingJira ? "Updating..." : "Update Jira"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {analysisResult && !rootCauseAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">{analysisResult}</pre>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={() => exportAnalysis('txt')} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export TXT
              </Button>
              <Button onClick={() => exportAnalysis('json')} variant="outline" className="flex-1">
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
                  <TrendingUp className="w-4 h-4 mr-2" />
                )}
                {isUpdatingJira ? "Updating..." : "Update Jira"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

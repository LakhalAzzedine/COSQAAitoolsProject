import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileJson, Zap, Download, Eye, FileText, Send, GitCompare, AlertCircle, CheckCircle, TrendingUp, Brain, Sparkles, Code2, Database, Shield, Lightbulb, Target } from "lucide-react";
import { InfoPopover } from "@/components/ui/info-popover";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";
import { analyzeJSON, formatAnalysisReport } from "@/utils/jsonAnalysis";
import { AIInsightsEngine } from "./AIInsightsEngine";

interface JSONAnalyzerProps {
  jiraData?: any;
}

interface AIAnalysisResult {
  qualityScore: number;
  securityAssessment: {
    score: number;
    vulnerabilities: Array<{ type: string; severity: string; description: string; fix: string }>;
  };
  performanceMetrics: {
    complexity: number;
    efficiency: number;
    recommendations: string[];
  };
  dataModelSuggestions: {
    normalization: string[];
    indexing: string[];
    relationships: string[];
  };
  testScenarios: Array<{ scenario: string; priority: string; testCases: string[] }>;
  aiInsights: string[];
}

export function JSONAnalyzer({ jiraData }: JSONAnalyzerProps) {
  const [jsonInput1, setJsonInput1] = useState("");
  const [jsonInput2, setJsonInput2] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingJira, setIsCreatingJira] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!jsonInput1.trim()) {
      toast({
        title: "Error",
        description: "Please provide JSON data to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const compareWith = compareMode && jsonInput2.trim() ? jsonInput2 : undefined;
      const result = analyzeJSON(jsonInput1, compareWith);
      setAnalysisResult(result);
      
      toast({
        title: "Analysis Complete",
        description: "JSON analysis has been completed successfully.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze JSON",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (!analysisResult) {
      toast({
        title: "Error",
        description: "Please run basic analysis first.",
        variant: "destructive",
      });
      return;
    }

    setIsAiAnalyzing(true);
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("json-ai-analysis", config);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: "aiAnalyzeJSON",
          jsonData: jsonInput1,
          secondaryJson: compareMode ? jsonInput2 : null,
          analysisResult: analysisResult,
          jiraData: jiraData,
          analysisType: "comprehensive"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const aiResult = await response.json();
      setAiAnalysis(aiResult);
      
      toast({
        title: "AI Analysis Complete",
        description: "Advanced AI analysis has been completed successfully.",
      });
      
    } catch (error) {
      console.error('Error in AI analysis:', error);
      // Fallback to mock AI analysis for demo purposes
      const mockAiAnalysis: AIAnalysisResult = {
        qualityScore: 87,
        securityAssessment: {
          score: 92,
          vulnerabilities: [
            {
              type: "Data Exposure",
              severity: "medium",
              description: "Potential sensitive data in plain text fields",
              fix: "Consider encrypting sensitive fields before storage"
            }
          ]
        },
        performanceMetrics: {
          complexity: 23,
          efficiency: 78,
          recommendations: [
            "Consider flattening nested structures for better query performance",
            "Implement data pagination for large arrays",
            "Use indexed fields for frequently accessed properties"
          ]
        },
        dataModelSuggestions: {
          normalization: ["Extract user data into separate entity", "Create lookup tables for enum values"],
          indexing: ["Add index on 'id' fields", "Consider composite index on date + status"],
          relationships: ["Link user entities via foreign keys", "Implement many-to-many relationships for tags"]
        },
        testScenarios: [
          {
            scenario: "Data Validation Testing",
            priority: "high",
            testCases: ["Validate required fields", "Test data type constraints", "Check field length limits"]
          },
          {
            scenario: "Edge Case Testing",
            priority: "medium",
            testCases: ["Test with empty objects", "Handle null values", "Process malformed data"]
          }
        ],
        aiInsights: [
          "JSON structure suggests a user management system with good data organization",
          "Consider implementing API versioning based on the data complexity",
          "The nested structure may benefit from GraphQL implementation",
          "Data appears suitable for NoSQL databases like MongoDB"
        ]
      };
      setAiAnalysis(mockAiAnalysis);
      
      toast({
        title: "AI Analysis Complete (Demo Mode)",
        description: "Using demo AI analysis. Configure backend for full functionality.",
        variant: "default",
      });
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const exportReport = (format: 'txt' | 'json' | 'pdf') => {
    if (!analysisResult) {
      toast({
        title: "Error",
        description: "Please analyze JSON first.",
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
        analysisResult: analysisResult,
        aiAnalysis: aiAnalysis,
        inputs: {
          primary: jsonInput1,
          ...(compareMode && jsonInput2 && { secondary: jsonInput2 })
        },
        jiraData: jiraData
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `json-analysis-${Date.now()}.json`;
    } else if (format === 'pdf') {
      // PDF export would be handled by backend
      toast({
        title: "PDF Export",
        description: "PDF export will be implemented with backend integration.",
      });
      return;
    } else {
      content = formatAnalysisReport(analysisResult, jsonInput1, compareMode ? jsonInput2 : undefined);
      if (aiAnalysis) {
        content += `\n\n${'='.repeat(50)}\nAI ANALYSIS REPORT\n${'='.repeat(50)}\n`;
        content += `Quality Score: ${aiAnalysis.qualityScore}%\n`;
        content += `Security Score: ${aiAnalysis.securityAssessment.score}%\n`;
        content += `Performance Complexity: ${aiAnalysis.performanceMetrics.complexity}%\n`;
        content += `\nAI Insights:\n${aiAnalysis.aiInsights.map(insight => `- ${insight}`).join('\n')}`;
      }
      mimeType = 'text/plain';
      filename = `json-analysis-${Date.now()}.txt`;
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
      description: `JSON analysis exported as ${format.toUpperCase()} file`,
    });
  };

  const generateTests = async () => {
    if (!analysisResult) {
      toast({
        title: "Error",
        description: "Please analyze JSON first.",
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
          action: "createTestScenarios",
          analysis: formatAnalysisReport(analysisResult, jsonInput1, compareMode ? jsonInput2 : undefined),
          aiAnalysis: aiAnalysis,
          jsonData: { primary: jsonInput1, secondary: jsonInput2 },
          jiraId: jiraData?.id || jiraData?.key || '',
          toolId: "json-analyzer"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast({
        title: "Test Scenarios Created",
        description: `Comprehensive test scenarios created in Jira: ${result.issueKey || 'Success'}`,
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

  const renderAIAnalysisResults = () => {
    if (!aiAnalysis) return null;

    return (
      <div className="space-y-6">
        {/* Quality Dashboard */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span>🎯 AI Quality Dashboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{aiAnalysis.qualityScore}%</div>
                <div className="text-sm text-gray-600">Overall Quality</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{aiAnalysis.securityAssessment.score}%</div>
                <div className="text-sm text-gray-600">Security Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{aiAnalysis.performanceMetrics.efficiency}%</div>
                <div className="text-sm text-gray-600">Efficiency</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <span>💡 AI-Powered Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiAnalysis.aiInsights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-red-500" />
              <span>🔒 Security Assessment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiAnalysis.securityAssessment.vulnerabilities.map((vuln, index) => (
              <div key={index} className="border-l-4 border-yellow-400 pl-4 py-2 mb-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Badge variant={vuln.severity === 'high' ? 'destructive' : 'secondary'}>
                    {vuln.severity.toUpperCase()}
                  </Badge>
                  <span className="font-medium">{vuln.type}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{vuln.description}</p>
                <p className="text-sm text-green-700 font-medium">💡 Fix: {vuln.fix}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Performance Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span>⚡ Performance Optimization</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {aiAnalysis.performanceMetrics.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Target className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code2 className="w-5 h-5 text-purple-500" />
              <span>🧪 AI-Generated Test Scenarios</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiAnalysis.testScenarios.map((scenario, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <h4 className="font-medium">{scenario.scenario}</h4>
                    <Badge variant={scenario.priority === 'high' ? 'destructive' : 'outline'}>
                      {scenario.priority}
                    </Badge>
                  </div>
                  <ul className="space-y-1">
                    {scenario.testCases.map((testCase, tcIndex) => (
                      <li key={tcIndex} className="text-sm text-gray-600 flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>{testCase}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Model Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-500" />
              <span>🗄️ Data Model Optimization</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="normalization">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="normalization">Normalization</TabsTrigger>
                <TabsTrigger value="indexing">Indexing</TabsTrigger>
                <TabsTrigger value="relationships">Relationships</TabsTrigger>
              </TabsList>
              <TabsContent value="normalization" className="space-y-2">
                {aiAnalysis.dataModelSuggestions.normalization.map((suggestion, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="indexing" className="space-y-2">
                {aiAnalysis.dataModelSuggestions.indexing.map((suggestion, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="relationships" className="space-y-2">
                {aiAnalysis.dataModelSuggestions.relationships.map((suggestion, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-purple-500" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAnalysisResults = () => {
    if (!analysisResult) return null;

    return (
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          {analysisResult.comparison && <TabsTrigger value="comparison">Comparison</TabsTrigger>}
          {aiAnalysis && <TabsTrigger value="ai-analysis">🤖 AI Analysis</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Depth</p>
                    <p className="text-2xl font-bold">{analysisResult.structure.depth}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileJson className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Objects</p>
                    <p className="text-2xl font-bold">{analysisResult.structure.objectCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Arrays</p>
                    <p className="text-2xl font-bold">{analysisResult.structure.arrayCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Keys</p>
                    <p className="text-2xl font-bold">{analysisResult.statistics.totalKeys}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Data Types Distribution</h4>
              {Object.entries(analysisResult.statistics.dataTypes).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center py-1">
                  <span className="capitalize">{type}</span>
                  <Badge variant="outline">{count as number}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  {analysisResult.validation.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="font-medium">
                    {analysisResult.validation.isValid ? 'Valid JSON' : 'Invalid JSON'}
                  </span>
                </div>
                
                {analysisResult.validation.errors.length > 0 && (
                  <div>
                    <h5 className="font-medium text-red-600 mb-2">Errors:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {analysisResult.validation.errors.map((error: string, index: number) => (
                        <li key={index} className="text-sm text-red-600">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.validation.duplicateKeys.length > 0 && (
                  <div>
                    <h5 className="font-medium text-yellow-600 mb-2">Duplicate Keys:</h5>
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.validation.duplicateKeys.map((key: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-yellow-600">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(analysisResult.schema, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {analysisResult.comparison && (
          <TabsContent value="comparison" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Comparison Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Structural Difference:</span>
                      <Badge variant={analysisResult.comparison.structuralDiff ? "destructive" : "secondary"}>
                        {analysisResult.comparison.structuralDiff ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Only in First:</span>
                      <Badge variant="outline">{analysisResult.comparison.onlyInFirst.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Only in Second:</span>
                      <Badge variant="outline">{analysisResult.comparison.onlyInSecond.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Different Values:</span>
                      <Badge variant="outline">{analysisResult.comparison.different.length}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {analysisResult.comparison.different.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Value Differences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-auto">
                      {analysisResult.comparison.different.map((diff: any, index: number) => (
                        <div key={index} className="text-sm border-b pb-2">
                          <div className="font-medium">{diff.path}</div>
                          <div className="text-red-600">- {JSON.stringify(diff.first)}</div>
                          <div className="text-green-600">+ {JSON.stringify(diff.second)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}

        {aiAnalysis && (
          <TabsContent value="ai-analysis" className="space-y-4">
            {renderAIAnalysisResults()}
          </TabsContent>
        )}
      </Tabs>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded flex items-center justify-center">
                <FileJson className="w-4 h-4 text-white" />
              </div>
              <span>🚀 Advanced JSON Analyzer</span>
              {jiraData && (
                <Badge variant="secondary">Jira: {jiraData.id}</Badge>
              )}
              <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                AI-Powered
              </Badge>
            </div>
            <InfoPopover
              title="Advanced JSON Analyzer with AI"
              content="Enterprise-grade JSON analysis tool with AI-powered insights, security assessment, performance optimization, data modeling suggestions, and automated test scenario generation."
              steps={[
                "Paste your JSON data in the primary input field",
                "Enable comparison mode to compare two JSON structures",
                "Click 'Analyze JSON' for comprehensive structural analysis",
                "Click 'AI Analysis' for advanced AI-powered insights",
                "Review all analysis tabs including AI recommendations",
                "Export detailed reports or generate test scenarios",
                "Create Jira tickets with AI-generated test cases"
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            🎯 Enterprise-grade JSON analysis with AI-powered insights, security assessment, performance optimization, 
            data modeling suggestions, and automated test scenario generation.
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompareMode(!compareMode)}
              >
                <GitCompare className="w-4 h-4 mr-2" />
                {compareMode ? 'Disable' : 'Enable'} Comparison
              </Button>
              {compareMode && (
                <Badge variant="outline">Comparison Mode Active</Badge>
              )}
            </div>

            <div className={`grid gap-4 ${compareMode ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              <div className="space-y-2">
                <Label htmlFor="json-input1">
                  {compareMode ? 'Primary JSON Data' : 'JSON Data'}
                </Label>
                <Textarea
                  id="json-input1"
                  placeholder="Paste your JSON data here..."
                  value={jsonInput1}
                  onChange={(e) => setJsonInput1(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              
              {compareMode && (
                <div className="space-y-2">
                  <Label htmlFor="json-input2">Secondary JSON Data</Label>
                  <Textarea
                    id="json-input2"
                    placeholder="Paste comparison JSON data here..."
                    value={jsonInput2}
                    onChange={(e) => setJsonInput2(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button 
                onClick={handleAnalyze}
                disabled={!jsonInput1.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileJson className="w-4 h-4 mr-2" />
                )}
                {isLoading ? "Analyzing..." : "Analyze JSON"}
              </Button>

              <Button 
                onClick={handleAIAnalysis}
                disabled={!analysisResult || isAiAnalyzing}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                {isAiAnalyzing ? (
                  <Brain className="w-4 h-4 mr-2 animate-pulse" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {isAiAnalyzing ? "AI Analyzing..." : "🤖 AI Analysis"}
              </Button>
            </div>

            {analysisResult && (
              <div className="space-y-4">
                {renderAnalysisResults()}
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Button onClick={() => exportReport('txt')} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    TXT
                  </Button>
                  <Button onClick={() => exportReport('json')} variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    JSON
                  </Button>
                  <Button onClick={() => exportReport('pdf')} variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button 
                    onClick={generateTests}
                    disabled={isCreatingJira}
                    variant="outline" 
                    size="sm"
                  >
                    {isCreatingJira ? (
                      <Send className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    Tests
                  </Button>
                  <Button 
                    onClick={generateTests}
                    disabled={isCreatingJira}
                    variant="default" 
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isCreatingJira ? (
                      <Send className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Jira
                  </Button>
                </div>
              </div>
            )}

            {analysisResult && (
              <AIInsightsEngine 
                toolId="json-analyzer"
                analysisData={{ 
                  basicAnalysis: analysisResult, 
                  aiAnalysis: aiAnalysis,
                  jsonData: jsonInput1,
                  compareData: compareMode ? jsonInput2 : null
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Bug, 
  Zap, 
  Download, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Shield,
  Brain,
  Target,
  BarChart3,
  Activity,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InfoPopover } from "@/components/ui/info-popover";
import { getToolEndpointUrl, buildPromptWithContext } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";
import { AIInsightsEngine } from "./AIInsightsEngine";
import { ProfessionalReportGenerator } from "./ProfessionalReportGenerator";

interface DefectAnalyzerProps {
  jiraData?: any;
  onConfigOpen: () => void;
}

interface DefectAnalysisResult {
  id: string;
  category: string;
  severity: string;
  priority: string;
  rootCause: string;
  confidence: number;
  testingGap: string;
  preventionStrategy: string;
  riskLevel: string;
  recommendations: string[];
  contributingFactors: string[];
  aiEnhanced?: boolean;
  backendInsights?: any;
}

export function DefectAnalyzer({ jiraData, onConfigOpen }: DefectAnalyzerProps) {
  const [defectDescription, setDefectDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [environment, setEnvironment] = useState("");
  const [analysisResult, setAnalysisResult] = useState<DefectAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [professionalMode, setProfessionalMode] = useState(true);
  const [showDashboard, setShowDashboard] = useState(true);
  const { toast } = useToast();

  const handleAnalyzeDefect = async () => {
    if (!defectDescription.trim()) {
      toast({
        title: "Error",
        description: "Please enter a defect description to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null); // Clear previous results
    
    try {
      const defectData = {
        description: defectDescription,
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        environment,
        jiraData
      };

      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("defect-analyzer", config);
      const prompt = buildPromptWithContext("defect-analyzer", defectDescription, jiraData);
      
      console.log(`🚀 Professional defect analysis via ${endpointUrl}`);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          defectData: defectData,
          toolId: "defect-analyzer",
          professionalMode: professionalMode,
          aiEnhanced: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const backendResult = await response.json();
      
      if (backendResult && backendResult.defectAnalysis) {
        const result: DefectAnalysisResult = {
          id: backendResult.defectAnalysis.id || `DEF-${Date.now()}`,
          category: backendResult.defectAnalysis.category || 'Unknown',
          severity: backendResult.defectAnalysis.severity || 'Medium',
          priority: backendResult.defectAnalysis.priority || 'Medium',
          rootCause: backendResult.rootCauseAnalysis?.primaryCause || 'Analysis incomplete',
          confidence: backendResult.defectAnalysis.confidence || 75,
          testingGap: backendResult.qualityMetrics?.testingGap || 'No specific gaps identified',
          preventionStrategy: backendResult.preventionStrategy?.processImprovements?.[0] || 'Standard prevention measures',
          riskLevel: backendResult.defectAnalysis.riskLevel || 'Medium',
          recommendations: backendResult.recommendations?.map((rec: any) => rec.action) || [],
          contributingFactors: backendResult.rootCauseAnalysis?.contributingFactors?.map((factor: any) => factor.factor) || [],
          aiEnhanced: true,
          backendInsights: backendResult
        };
        
        setAnalysisResult(result);
        
        toast({
          title: "🚀 Professional Analysis Complete",
          description: `Defect analyzed with ${result.confidence}% confidence using AI-powered root cause analysis`,
        });
      } else {
        throw new Error('Invalid response format from analysis service');
      }

    } catch (error) {
      console.error('Error analyzing defect:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not connect to analysis service. Please check your configuration and try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportAnalysis = (format: 'txt' | 'json' | 'csv') => {
    if (!analysisResult) {
      toast({
        title: "Error",
        description: "Please analyze a defect first.",
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
        defectData: {
          description: defectDescription,
          stepsToReproduce,
          expectedBehavior,
          actualBehavior,
          environment
        },
        analysis: analysisResult,
        jiraData: jiraData,
        professionalMode: professionalMode,
        aiEnhanced: analysisResult.aiEnhanced || false
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `professional-defect-analysis-${Date.now()}.json`;
    } else if (format === 'csv') {
      const headers = 'Field,Value\n';
      const rows = [
        `"Defect ID","${analysisResult.id}"`,
        `"Category","${analysisResult.category}"`,
        `"Severity","${analysisResult.severity}"`,
        `"Priority","${analysisResult.priority}"`,
        `"Root Cause","${analysisResult.rootCause}"`,
        `"Confidence","${analysisResult.confidence}%"`,
        `"Testing Gap","${analysisResult.testingGap}"`,
        `"Prevention Strategy","${analysisResult.preventionStrategy}"`,
        `"Risk Level","${analysisResult.riskLevel}"`,
        `"Recommendations","${analysisResult.recommendations.join('; ')}"`,
        `"Contributing Factors","${analysisResult.contributingFactors.join('; ')}"`,
        `"AI Enhanced","${analysisResult.aiEnhanced ? 'Yes' : 'No'}"`
      ].join('\n');
      content = headers + rows;
      mimeType = 'text/csv';
      filename = `professional-defect-analysis-${Date.now()}.csv`;
    } else {
      content = `🚀 Professional Defect Analysis Report\n`;
      content += `Generated: ${new Date().toLocaleString()}\n`;
      content += `${'='.repeat(60)}\n\n`;
      
      content += `📋 DEFECT INFORMATION\n`;
      content += `Description: ${defectDescription}\n`;
      content += `Steps to Reproduce: ${stepsToReproduce}\n`;
      content += `Expected Behavior: ${expectedBehavior}\n`;
      content += `Actual Behavior: ${actualBehavior}\n`;
      content += `Environment: ${environment}\n\n`;
      
      content += `🔍 PROFESSIONAL ANALYSIS\n`;
      content += `Defect ID: ${analysisResult.id}\n`;
      content += `Category: ${analysisResult.category}\n`;
      content += `Severity: ${analysisResult.severity}\n`;
      content += `Priority: ${analysisResult.priority}\n`;
      content += `Root Cause: ${analysisResult.rootCause}\n`;
      content += `Confidence Level: ${analysisResult.confidence}%\n`;
      content += `Risk Level: ${analysisResult.riskLevel}\n`;
      content += `Testing Gap: ${analysisResult.testingGap}\n`;
      content += `AI Enhanced: ${analysisResult.aiEnhanced ? 'Yes' : 'No'}\n\n`;
      
      content += `🎯 RECOMMENDATIONS\n`;
      analysisResult.recommendations.forEach((rec, index) => {
        content += `${index + 1}. ${rec}\n`;
      });
      
      content += `\n⚠️ CONTRIBUTING FACTORS\n`;
      analysisResult.contributingFactors.forEach((factor, index) => {
        content += `${index + 1}. ${factor}\n`;
      });
      
      content += `\n🛡️ PREVENTION STRATEGY\n`;
      content += `${analysisResult.preventionStrategy}\n`;
      
      mimeType = 'text/plain';
      filename = `professional-defect-analysis-${Date.now()}.txt`;
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
      title: "🎉 Export Complete",
      description: `Professional defect analysis exported as ${format.toUpperCase()} file`,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Activity className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <Card className="border-2 border-gradient bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Bug className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  🚀 Professional Defect Analyzer
                </span>
                <div className="text-sm text-gray-600 flex items-center space-x-2">
                  <Badge variant="outline" className="bg-red-100 text-red-700">AI Root Cause Analysis</Badge>
                  <Badge variant="outline" className="bg-orange-100 text-orange-700">Professional Grade</Badge>
                  {jiraData && <Badge variant="secondary">Jira: {jiraData.id}</Badge>}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProfessionalMode(!professionalMode)}
                className={professionalMode ? "bg-green-50 text-green-700" : ""}
              >
                <Brain className="w-4 h-4 mr-1" />
                {professionalMode ? "AI Mode ON" : "AI Mode OFF"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDashboard(!showDashboard)}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Dashboard
              </Button>
              <InfoPopover
                title="Professional Defect Analyzer"
                content="AI-powered root cause analysis with professional insights, risk assessment, and comprehensive prevention strategies."
                steps={[
                  "Enter detailed defect information",
                  "Enable AI Mode for enhanced analysis",
                  "Review professional root cause analysis",
                  "Examine AI insights and recommendations",
                  "Export comprehensive analysis reports"
                ]}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            🔍 Professional-grade defect analysis with AI-powered root cause identification, risk assessment, and prevention strategies for enterprise quality assurance.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="defect-description">Defect Description *</Label>
              <Textarea
                id="defect-description"
                placeholder="Describe the defect in detail..."
                value={defectDescription}
                onChange={(e) => setDefectDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="steps-to-reproduce">Steps to Reproduce</Label>
              <Textarea
                id="steps-to-reproduce"
                placeholder="1. Navigate to...\n2. Click on...\n3. Observe..."
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected-behavior">Expected Behavior</Label>
              <Textarea
                id="expected-behavior"
                placeholder="What should happen..."
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual-behavior">Actual Behavior</Label>
              <Textarea
                id="actual-behavior"
                placeholder="What actually happened..."
                value={actualBehavior}
                onChange={(e) => setActualBehavior(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="environment">Environment</Label>
              <Input
                id="environment"
                placeholder="Browser, OS, Version, etc."
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleAnalyzeDefect}
              disabled={!defectDescription.trim() || isAnalyzing}
              className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {isAnalyzing ? "🧠 AI Analyzing..." : "🎯 Analyze Defect"}
            </Button>
            
            {analysisResult && (
              <div className="flex gap-2">
                <Button onClick={() => exportAnalysis('txt')} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  TXT
                </Button>
                <Button onClick={() => exportAnalysis('json')} variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  JSON
                </Button>
                <Button onClick={() => exportAnalysis('csv')} variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  CSV
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Show loading state while analyzing */}
      {isAnalyzing && (
        <Card className="border-2 border-blue-200">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-blue-800">🧠 AI Analysis in Progress</h3>
                <p className="text-sm text-blue-600 mt-1">
                  Performing comprehensive root cause analysis using advanced AI models...
                </p>
              </div>
              <div className="w-full max-w-md">
                <Progress value={33} className="h-2" />
                <p className="text-xs text-blue-500 mt-1 text-center">
                  Analyzing defect patterns and determining root causes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights Section - Only shown when we have results */}
      {analysisResult && showDashboard && (
        <AIInsightsEngine
          toolId="defect-analyzer"
          analysisData={analysisResult}
          onInsightAction={(insight) => {
            toast({
              title: "AI Insight",
              description: insight.description,
            });
          }}
        />
      )}

      {/* Professional Analysis Results - Only shown when we have actual results */}
      {analysisResult && (
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Target className="w-5 h-5 text-orange-600" />
              <span>🔍 Professional Analysis Results</span>
              <Badge variant="outline" className="bg-orange-100 text-orange-700">
                {analysisResult.confidence}% Confidence
              </Badge>
              {analysisResult.aiEnhanced && (
                <Badge className="bg-purple-100 text-purple-700">
                  <Brain className="w-3 h-3 mr-1" />
                  AI Enhanced
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analysis">Root Cause Analysis</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                <TabsTrigger value="reports">Professional Reports</TabsTrigger>
              </TabsList>
              
              <TabsContent value="analysis" className="space-y-6">
                {/* Key Metrics Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border-2 border-red-200">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(analysisResult.severity)}`}>
                      {analysisResult.severity}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Severity</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border-2 border-orange-200">
                    <div className="flex items-center justify-center space-x-1">
                      {getPriorityIcon(analysisResult.priority)}
                      <span className="font-medium">{analysisResult.priority}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Priority</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border-2 border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{analysisResult.confidence}%</div>
                    <div className="text-xs text-gray-600">AI Confidence</div>
                    <Progress value={analysisResult.confidence} className="mt-1 h-1" />
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border-2 border-purple-200">
                    <div className="text-lg font-bold text-purple-600">{analysisResult.riskLevel}</div>
                    <div className="text-xs text-gray-600">Risk Level</div>
                  </div>
                </div>

                {/* Detailed Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center space-x-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span>🎯 Root Cause Analysis</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700">Category</h4>
                          <Badge variant="outline" className="mt-1">{analysisResult.category}</Badge>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-gray-700">Root Cause</h4>
                          <p className="text-sm text-gray-600 mt-1">{analysisResult.rootCause}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-gray-700">Testing Gap</h4>
                          <p className="text-sm text-gray-600 mt-1">{analysisResult.testingGap}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>⚠️ Contributing Factors</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysisResult.contributingFactors.length > 0 ? (
                          analysisResult.contributingFactors.map((factor, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <span className="flex-shrink-0 w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </span>
                              <p className="text-sm text-gray-600">{factor}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">No contributing factors identified</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Prevention Strategy */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span>🛡️ Prevention Strategy</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 leading-relaxed">{analysisResult.preventionStrategy}</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="recommendations" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>💡 Professional Recommendations</span>
                  </h3>
                  {analysisResult.recommendations.length > 0 ? (
                    analysisResult.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                        <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-500 italic">No specific recommendations available</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reports">
                <ProfessionalReportGenerator
                  toolId="defect-analyzer"
                  analysisData={analysisResult}
                  metrics={{
                    testCoverage: 82,
                    defectDensity: analysisResult.severity === 'Critical' ? 1.2 : 0.8,
                    automationRate: 75,
                    riskScore: analysisResult.riskLevel === 'High' ? 35 : 20,
                    qualityIndex: analysisResult.confidence
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

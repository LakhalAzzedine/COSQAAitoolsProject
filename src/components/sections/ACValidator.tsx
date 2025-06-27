
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Zap, AlertTriangle, FileText, FileCode, Download, Send, Brain, Shield, Target, TrendingUp, Eye, Filter, TestTube } from "lucide-react";
import { InfoPopover } from "@/components/ui/info-popover";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl, buildPromptWithContext } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";
import { useQTestIntegration } from "@/hooks/useQTestIntegration";

interface ACValidatorProps {
  jiraData?: any;
  onConfigOpen: () => void;
}

interface ValidationResult {
  id: string;
  criterion: string;
  score: number;
  status: 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical';
  issues: string[];
  suggestions: string[];
  category: 'Clarity' | 'Completeness' | 'Testability' | 'Measurability' | 'Consistency';
  priority: 'High' | 'Medium' | 'Low';
}

interface QualityMetrics {
  overallScore: number;
  clarityScore: number;
  completenessScore: number;
  testabilityScore: number;
  measurabilityScore: number;
  consistencyScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  improvementPotential: number;
}

interface ACImprovement {
  type: 'missing_scenario' | 'unclear_requirement' | 'untestable_criterion' | 'vague_definition';
  title: string;
  description: string;
  originalText: string;
  suggestedText: string;
  impact: 'High' | 'Medium' | 'Low';
  category: string;
}

export function ACValidator({ jiraData, onConfigOpen }: ACValidatorProps) {
  const { isCreatingQTest, createInQTest } = useQTestIntegration();

  const [jiraStoryId, setJiraStoryId] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [validationResult, setValidationResult] = useState("");
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [improvements, setImprovements] = useState<ACImprovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingJira, setIsUpdatingJira] = useState(false);
  const [activeTab, setActiveTab] = useState("validator");
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

      const endpointUrl = getToolEndpointUrl("ac-validator", config);
      
      const contentToAnalyze = acceptanceCriteria || 
        (enhancedJiraData ? enhancedJiraData.acceptanceCriteria.join('\n') : '');
      
      const prompt = buildPromptWithContext("ac-validator", contentToAnalyze, enhancedJiraData);
      
      console.log(`AI-powered AC validation via ${endpointUrl}`);
      
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
          jiraData: enhancedJiraData,
          aiEnhanced: true,
          detailedAnalysis: true,
          includeMetrics: true,
          includeImprovements: true,
          includeValidationResults: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("AI AC validation response:", result);
      
      const validationText = result.response || result.validation || result.data?.response || result.data?.validation || "No validation results generated";
      
      setValidationResult(validationText);
      
      // Parse structured response from LLM
      if (result.validationResults && Array.isArray(result.validationResults)) {
        setValidationResults(result.validationResults);
      } else {
        await generateDetailedValidation(contentToAnalyze, enhancedJiraData);
      }
      
      if (result.qualityMetrics) {
        setQualityMetrics(result.qualityMetrics);
      } else {
        await generateQualityMetrics(contentToAnalyze, enhancedJiraData);
      }
      
      if (result.improvements && Array.isArray(result.improvements)) {
        setImprovements(result.improvements);
      } else {
        await generateImprovements(contentToAnalyze, enhancedJiraData);
      }
      
      toast({
        title: "AI-Powered AC Validation Complete",
        description: jiraStoryId ? `Professional AC analysis completed for JIRA story ${jiraStoryId}` : "Comprehensive acceptance criteria validation completed",
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

  const generateDetailedValidation = async (content: string, jiraData: any) => {
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("ac-validator", config);
      
      const validationPrompt = `Analyze the following acceptance criteria and provide detailed validation results for each quality dimension:

Acceptance Criteria:
${content}

JIRA Context: ${jiraData ? JSON.stringify(jiraData) : 'None'}

Please provide detailed validation analysis in JSON format with scores for clarity, completeness, testability, measurability, and consistency. Include specific issues and suggestions for each criterion.`;

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: validationPrompt,
          toolId: "ac-validator-detailed",
          requestType: "detailed-validation"
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        try {
          const parsedResults = JSON.parse(result.response || '{"validationResults": []}');
          if (parsedResults.validationResults) {
            setValidationResults(parsedResults.validationResults);
          }
        } catch (parseError) {
          console.error('Error parsing validation results:', parseError);
        }
      }
    } catch (error) {
      console.error('Error generating detailed validation:', error);
    }
  };

  const generateQualityMetrics = async (content: string, jiraData: any) => {
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("ac-validator", config);
      
      const metricsPrompt = `Analyze the following acceptance criteria and calculate quality metrics:

Acceptance Criteria:
${content}

JIRA Context: ${jiraData ? JSON.stringify(jiraData) : 'None'}

Please provide quality metrics in JSON format:
{
  "overallScore": 0-100,
  "clarityScore": 0-100,
  "completenessScore": 0-100,
  "testabilityScore": 0-100,
  "measurabilityScore": 0-100,
  "consistencyScore": 0-100,
  "riskLevel": "Low|Medium|High",
  "improvementPotential": 0-100
}`;

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: metricsPrompt,
          toolId: "ac-validator-metrics",
          requestType: "quality-metrics"
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        try {
          const parsedMetrics = JSON.parse(result.response || '{}');
          if (parsedMetrics.overallScore !== undefined) {
            setQualityMetrics(parsedMetrics);
          }
        } catch (parseError) {
          console.error('Error parsing quality metrics:', parseError);
        }
      }
    } catch (error) {
      console.error('Error generating quality metrics:', error);
    }
  };

  const generateImprovements = async (content: string, jiraData: any) => {
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("ac-validator", config);
      
      const improvementsPrompt = `Analyze the following acceptance criteria and provide specific improvement recommendations:

Acceptance Criteria:
${content}

JIRA Context: ${jiraData ? JSON.stringify(jiraData) : 'None'}

Please provide improvement recommendations in JSON format with original and suggested text for each improvement.`;

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: improvementsPrompt,
          toolId: "ac-validator-improvements",
          requestType: "improvements"
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        try {
          const parsedImprovements = JSON.parse(result.response || '{"improvements": []}');
          if (parsedImprovements.improvements) {
            setImprovements(parsedImprovements.improvements);
          }
        } catch (parseError) {
          console.error('Error parsing improvements:', parseError);
        }
      }
    } catch (error) {
      console.error('Error generating improvements:', error);
    }
  };

  const exportReport = (format: 'txt' | 'json' | 'professional') => {
    if (!validationResult && !qualityMetrics) {
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
        validationResults: validationResults,
        qualityMetrics: qualityMetrics,
        improvements: improvements,
        jiraData: jiraData
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `ac-validation-analysis-${Date.now()}.json`;
    } else if (format === 'professional') {
      content = generateProfessionalReport();
      mimeType = 'text/plain';
      filename = `ac-quality-report-${Date.now()}.txt`;
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
      description: `Professional AC validation report exported as ${format.toUpperCase()} file`,
    });
  };

  const generateProfessionalReport = () => {
    return `
# ACCEPTANCE CRITERIA QUALITY ANALYSIS REPORT
Generated on: ${new Date().toLocaleString()}
JIRA Story: ${jiraStoryId}
Overall Quality Score: ${qualityMetrics?.overallScore || 0}/100

## EXECUTIVE SUMMARY
Risk Level: ${qualityMetrics?.riskLevel || 'Unknown'}
Improvement Potential: ${qualityMetrics?.improvementPotential || 0}%

## QUALITY METRICS
- Clarity Score: ${qualityMetrics?.clarityScore || 0}/100
- Completeness Score: ${qualityMetrics?.completenessScore || 0}/100
- Testability Score: ${qualityMetrics?.testabilityScore || 0}/100
- Measurability Score: ${qualityMetrics?.measurabilityScore || 0}/100
- Consistency Score: ${qualityMetrics?.consistencyScore || 0}/100

## DETAILED VALIDATION RESULTS
${validationResults.map(result => `
### ${result.criterion} - ${result.status}
Score: ${result.score}/100
Issues: ${result.issues.join(', ') || 'None identified'}
Suggestions: ${result.suggestions.join(', ')}
Priority: ${result.priority}
`).join('\n')}

## IMPROVEMENT RECOMMENDATIONS
${improvements.map(improvement => `
### ${improvement.title} (${improvement.impact} Impact)
Issue: ${improvement.description}
Original: "${improvement.originalText}"
Suggested: "${improvement.suggestedText}"
`).join('\n')}

## ORIGINAL VALIDATION OUTPUT
${validationResult}

---
Generated by AI-Powered AC Validator
Professional Quality Assurance Tool
    `.trim();
  };

  const createInQTestHandler = async () => {
    if (!validationResult && !qualityMetrics) {
      toast({
        title: "Error",
        description: "Please validate acceptance criteria first.",
        variant: "destructive",
      });
      return;
    }

    const acData = {
      acceptanceCriteria: acceptanceCriteria,
      validationResult: validationResult,
      validationResults: validationResults,
      qualityMetrics: qualityMetrics,
      improvements: improvements,
      jiraData: jiraData,
      timestamp: new Date().toISOString()
    };
    
    await createInQTest(acData, "ac-validator", "validation analysis");
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
    <div className="space-y-6">
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 dark:bg-gray-900 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold dark:text-gray-100">AI-Powered AC Validator</span>
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 dark:border-green-700">AI Enhanced</Badge>
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-700">Quality Focused</Badge>
                  {jiraData && (
                    <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">Jira: {jiraData.id}</Badge>
                  )}
                </div>
              </div>
            </div>
            <InfoPopover
              title="AI-Powered AC Validation"
              content="Comprehensive acceptance criteria validation with AI-driven quality analysis and improvement recommendations."
              steps={[
                "Enter JIRA Story ID or paste acceptance criteria",
                "AI analyzes quality across multiple dimensions",
                "Review detailed validation results and metrics",
                "Get specific improvement recommendations",
                "Export professional quality reports"
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground dark:text-gray-400 mb-4">
            Professional-grade acceptance criteria validation with AI-powered quality analysis, risk assessment, and improvement recommendations.
          </p>
          
          {qualityMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{qualityMetrics.overallScore}</div>
                <div className="text-xs text-blue-700 dark:text-blue-400">Overall Score</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{qualityMetrics.testabilityScore}</div>
                <div className="text-xs text-green-700 dark:text-green-400">Testability</div>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{qualityMetrics.clarityScore}</div>
                <div className="text-xs text-purple-700 dark:text-purple-400">Clarity</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 dark:bg-gray-800">
          <TabsTrigger value="validator" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Validator</TabsTrigger>
          <TabsTrigger value="analysis" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Analysis</TabsTrigger>
          <TabsTrigger value="improvements" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Improvements</TabsTrigger>
          <TabsTrigger value="export" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="validator" className="space-y-4">
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jira-story-id" className="dark:text-gray-300">JIRA Story ID</Label>
                  <Input
                    id="jira-story-id"
                    placeholder="Enter JIRA Story ID (e.g., PROJ-123)"
                    value={jiraStoryId}
                    onChange={(e) => setJiraStoryId(e.target.value)}
                    className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acceptance-criteria" className="dark:text-gray-300">Acceptance Criteria (Optional)</Label>
                  <Textarea
                    id="acceptance-criteria"
                    placeholder="Paste acceptance criteria to validate..."
                    value={acceptanceCriteria}
                    onChange={(e) => setAcceptanceCriteria(e.target.value)}
                    rows={8}
                    className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                
                <Button 
                  onClick={handleValidate}
                  disabled={(!jiraStoryId.trim() && !acceptanceCriteria.trim()) || isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 dark:from-green-600 dark:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700"
                >
                  {isLoading ? (
                    <Zap className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? "AI is Analyzing..." : "Validate with AI"}
                </Button>

                {validationResult && (
                  <div className="space-y-2">
                    <Label className="dark:text-gray-300">AI Validation Results</Label>
                    <div className="bg-muted dark:bg-gray-800 p-4 rounded-lg max-h-96 overflow-y-auto border dark:border-gray-700">
                      <pre className="text-sm whitespace-pre-wrap dark:text-gray-200">{validationResult}</pre>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <span className="dark:text-gray-100">Quality Analysis Dashboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {validationResults.length > 0 ? (
                <div className="space-y-4">
                  {validationResults.map((result) => (
                    <div key={result.id} className="p-4 border dark:border-gray-700 rounded-lg dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold dark:text-gray-100">{result.criterion}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            result.status === 'Excellent' ? 'default' :
                            result.status === 'Good' ? 'secondary' :
                            result.status === 'Needs Improvement' ? 'outline' : 'destructive'
                          } className="dark:border-gray-600">
                            {result.status}
                          </Badge>
                          <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">{result.score}/100</Badge>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <Progress value={result.score} className="h-2" />
                      </div>
                      
                      {result.issues.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">Issues:</span>
                          <ul className="text-sm text-red-600 dark:text-red-400 ml-4">
                            {result.issues.map((issue, index) => (
                              <li key={index}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Suggestions:</span>
                        <ul className="text-sm text-blue-600 dark:text-blue-400 ml-4">
                          {result.suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground dark:text-gray-400">Validate acceptance criteria to see detailed quality analysis.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4">
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500 dark:text-green-400" />
                <span className="dark:text-gray-100">AI Improvement Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {improvements.length > 0 ? (
                <div className="space-y-4">
                  {improvements.map((improvement, index) => (
                    <div key={index} className="p-4 border dark:border-gray-700 rounded-lg dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold dark:text-gray-100">{improvement.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={improvement.impact === 'High' ? 'destructive' : 'secondary'} className="dark:border-gray-600">
                            {improvement.impact} Impact
                          </Badge>
                          <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">{improvement.category}</Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3">{improvement.description}</p>
                      
                      <div className="space-y-2">
                        <div className="p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded">
                          <span className="text-sm font-medium text-red-700 dark:text-red-400">Original:</span>
                          <p className="text-sm text-red-700 dark:text-red-400">"{improvement.originalText}"</p>
                        </div>
                        <div className="p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded">
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">Suggested:</span>
                          <p className="text-sm text-green-700 dark:text-green-400">"{improvement.suggestedText}"</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground dark:text-gray-400">Validate acceptance criteria to see AI-powered improvement recommendations.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                <span className="dark:text-gray-100">Professional Export Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => exportReport('txt')} variant="outline" className="h-20 flex-col dark:border-gray-600 dark:text-gray-300">
                  <FileText className="w-6 h-6 mb-2" />
                  <span>Professional Report</span>
                  <span className="text-xs text-muted-foreground dark:text-gray-400">Comprehensive TXT report</span>
                </Button>
                <Button onClick={() => exportReport('json')} variant="outline" className="h-20 flex-col dark:border-gray-600 dark:text-gray-300">
                  <FileCode className="w-6 h-6 mb-2" />
                  <span>Structured Data</span>
                  <span className="text-xs text-muted-foreground dark:text-gray-400">JSON with validation data</span>
                </Button>
                <Button onClick={() => exportReport('professional')} variant="outline" className="h-20 flex-col dark:border-gray-600 dark:text-gray-300">
                  <TrendingUp className="w-6 h-6 mb-2" />
                  <span>Quality Analysis</span>
                  <span className="text-xs text-muted-foreground dark:text-gray-400">Professional quality report</span>
                </Button>
                <Button 
                  onClick={createInQTestHandler}
                  disabled={isCreatingQTest || (!validationResult && !qualityMetrics)}
                  variant="outline" 
                  className="h-20 flex-col bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 dark:border-blue-700"
                >
                  {isCreatingQTest ? (
                    <TestTube className="w-6 h-6 mb-2 animate-spin" />
                  ) : (
                    <TestTube className="w-6 h-6 mb-2" />
                  )}
                  <span>{isCreatingQTest ? "Creating..." : "Create in QTest"}</span>
                  <span className="text-xs text-muted-foreground dark:text-gray-400">QTest validation cases</span>
                </Button>
                <Button 
                  onClick={updateJira}
                  disabled={isUpdatingJira || !validationResult}
                  variant="outline" 
                  className="h-20 flex-col dark:border-gray-600 dark:text-gray-300"
                >
                  {isUpdatingJira ? (
                    <Send className="w-6 h-6 mb-2 animate-spin" />
                  ) : (
                    <Send className="w-6 h-6 mb-2" />
                  )}
                  <span>{isUpdatingJira ? "Updating..." : "Update Jira"}</span>
                  <span className="text-xs text-muted-foreground dark:text-gray-400">Enhanced JIRA update</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

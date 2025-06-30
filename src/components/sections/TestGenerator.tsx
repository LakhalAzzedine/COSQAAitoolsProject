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
import { FileCode, Zap, Download, FileText, Send, Eye, Brain, Target, Shield, CheckCircle2, AlertTriangle, TrendingUp, Filter, TestTube } from "lucide-react";
import { InfoPopover } from "@/components/ui/info-popover";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl, buildPromptWithContext } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";
import { useQTestIntegration } from "@/hooks/useQTestIntegration";

interface TestGeneratorProps {
  jiraData?: any;
  onConfigOpen: () => void;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  category: 'Functional' | 'Security' | 'Performance' | 'Integration' | 'UI/UX' | 'API';
  testCases: TestCase[];
  coverage: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  estimatedExecutionTime: string;
}

interface TestCase {
  id: string;
  title: string;
  description: string;
  preconditions: string[];
  steps: string[];
  expectedResults: string[];
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
  automationCandidate: boolean;
  riskCoverage: string[];
  dataRequirements: string[];
  environmentSetup: string[];
}

interface AIInsight {
  type: 'recommendation' | 'warning' | 'optimization' | 'coverage';
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  actionRequired: boolean;
}

export function TestGenerator({ jiraData, onConfigOpen }: TestGeneratorProps) {
  const { isCreatingQTest, createInQTest } = useQTestIntegration();

  const [jiraStoryId, setJiraStoryId] = useState("");
  const [testRequirements, setTestRequirements] = useState("");
  const [generatedTests, setGeneratedTests] = useState("");
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingJira, setIsCreatingJira] = useState(false);
  const [activeTab, setActiveTab] = useState("generator");
  const [analysisMetrics, setAnalysisMetrics] = useState({
    testCoverage: 0,
    riskCoverage: 0,
    automationReadiness: 0,
    qualityScore: 0
  });
  const { toast } = useToast();

  const handleGenerateTests = async () => {
    if (!jiraStoryId.trim() && !testRequirements.trim() && !jiraData) {
      toast({
        title: "Error",
        description: "Please enter a JIRA Story ID, test requirements, or ensure JIRA data is available.",
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

      let enhancedJiraData = jiraData || null;
      
      // If we have existing jiraData with acceptance criteria, use it directly
      if (jiraData && jiraData.acceptanceCriteria && jiraData.acceptanceCriteria.length > 0) {
        console.log(`Using existing JIRA data with ${jiraData.acceptanceCriteria.length} acceptance criteria`);
        enhancedJiraData = jiraData;
      } else if (jiraStoryId.trim()) {
        // Fetch JIRA data if we don't have it
        const jiraEndpointUrl = getToolEndpointUrl("jira-integration", config);
        
        console.log(`Fetching JIRA story details for: ${jiraStoryId}`);
        
        const jiraResponse = await fetch(`${jiraEndpointUrl}?jiraId=${encodeURIComponent(jiraStoryId.trim())}&action=fetchStory&includeAcceptanceCriteria=true`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!jiraResponse.ok) {
          throw new Error(`JIRA API error! status: ${jiraResponse.status}`);
        }
        
        const jiraResult = await jiraResponse.json();
        
        // Extract acceptance criteria from JIRA response
        const extractedAC = extractAcceptanceCriteriaFromJira(jiraResult);
        
        enhancedJiraData = {
          id: jiraStoryId,
          key: jiraResult.key || jiraStoryId,
          title: jiraResult.fields?.summary || jiraResult.title || jiraResult.summary || `Story ${jiraStoryId}`,
          description: jiraResult.fields?.description || jiraResult.description || '',
          acceptanceCriteria: extractedAC || [],
          status: jiraResult.fields?.status?.name || jiraResult.status || 'Unknown',
          assignee: jiraResult.fields?.assignee?.displayName || jiraResult.assignee || 'Unassigned'
        };
      }

      const endpointUrl = getToolEndpointUrl("test-generator", config);
      
      // Create enhanced prompt with acceptance criteria context
      let contentToAnalyze = testRequirements;
      
      if (enhancedJiraData) {
        const acContext = enhancedJiraData.acceptanceCriteria && enhancedJiraData.acceptanceCriteria.length > 0
          ? `\n\nAcceptance Criteria:\n${enhancedJiraData.acceptanceCriteria.map((ac: string, i: number) => `AC${i + 1}: ${ac}`).join('\n')}`
          : '';
        
        contentToAnalyze = `${enhancedJiraData.title}\n\n${enhancedJiraData.description}${acContext}`;
      }
      
      const prompt = buildPromptWithContext("test-generator", contentToAnalyze, enhancedJiraData);
      
      console.log(`Generating AI-powered test cases with AC analysis via ${endpointUrl}`);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          requirements: contentToAnalyze,
          toolId: "test-generator",
          jiraId: enhancedJiraData?.key || enhancedJiraData?.id || jiraStoryId || '',
          jiraData: enhancedJiraData,
          acceptanceCriteria: enhancedJiraData?.acceptanceCriteria || [],
          aiEnhanced: true,
          generateStructured: true,
          includeInsights: true,
          includeMetrics: true,
          includeSuites: true,
          acAnalysis: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("AI Test generation response:", result);
      
      const testsText = result.response || result.tests || result.data?.response || result.data?.tests || "No test cases generated";
      
      setGeneratedTests(testsText);
      
      // Parse structured response from LLM
      if (result.insights && Array.isArray(result.insights)) {
        setAiInsights(result.insights);
      } else {
        await generateAIInsights(testsText, enhancedJiraData);
      }
      
      if (result.testSuites && Array.isArray(result.testSuites)) {
        setTestSuites(result.testSuites);
      } else {
        await generateTestSuites(testsText, enhancedJiraData);
      }
      
      if (result.metrics) {
        setAnalysisMetrics(result.metrics);
      } else {
        await calculateMetrics(testsText, enhancedJiraData);
      }
      
      const acCount = enhancedJiraData?.acceptanceCriteria?.length || 0;
      
      toast({
        title: "AI-Powered Test Cases Generated",
        description: jiraStoryId ? `Test suite generated for JIRA story ${jiraStoryId}${acCount > 0 ? ` with ${acCount} AC analyzed` : ''}` : "Comprehensive test cases generated with AI insights",
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

  // Helper function to extract acceptance criteria from JIRA response
  const extractAcceptanceCriteriaFromJira = (jiraData: any) => {
    const criteria: string[] = [];
    
    if (jiraData.fields) {
      // Check various custom field names for acceptance criteria
      const acFields = [
        'customfield_10000', 'customfield_10001', 'customfield_10002', 'customfield_12345',
        'acceptanceCriteria', 'acceptance_criteria'
      ];
      
      acFields.forEach(field => {
        if (jiraData.fields[field]) {
          const value = jiraData.fields[field];
          if (typeof value === 'string') {
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

  const generateAIInsights = async (testContent: string, jiraData: any) => {
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("test-generator", config);
      
      const insightsPrompt = `Analyze the following test cases and provide AI insights including recommendations, warnings, optimizations, and coverage gaps:

Test Cases:
${testContent}

JIRA Context: ${jiraData ? JSON.stringify(jiraData) : 'None'}

Please provide insights in the following JSON format:
{
  "insights": [
    {
      "type": "recommendation|warning|optimization|coverage",
      "title": "Insight Title",
      "description": "Detailed description",
      "impact": "High|Medium|Low",
      "actionRequired": true|false
    }
  ]
}`;

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: insightsPrompt,
          toolId: "test-generator-insights",
          requestType: "ai-insights"
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const parsedInsights = JSON.parse(result.response || '{"insights": []}');
        if (parsedInsights.insights) {
          setAiInsights(parsedInsights.insights);
        }
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
  };

  const generateTestSuites = async (testContent: string, jiraData: any) => {
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("test-generator", config);
      
      const suitesPrompt = `Analyze the following test cases and organize them into structured test suites with categories, priorities, and metrics:

Test Cases:
${testContent}

JIRA Context: ${jiraData ? JSON.stringify(jiraData) : 'None'}

Please provide structured test suites in JSON format with proper categorization, risk levels, and estimated execution times.`;

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: suitesPrompt,
          toolId: "test-generator-suites",
          requestType: "test-suites"
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        try {
          const parsedSuites = JSON.parse(result.response || '{"testSuites": []}');
          if (parsedSuites.testSuites) {
            setTestSuites(parsedSuites.testSuites);
          }
        } catch (parseError) {
          console.error('Error parsing test suites:', parseError);
        }
      }
    } catch (error) {
      console.error('Error generating test suites:', error);
    }
  };

  const calculateMetrics = async (testContent: string, jiraData: any) => {
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("test-generator", config);
      
      const metricsPrompt = `Analyze the following test cases and calculate quality metrics including test coverage, risk coverage, automation readiness, and overall quality score:

Test Cases:
${testContent}

JIRA Context: ${jiraData ? JSON.stringify(jiraData) : 'None'}

Please provide metrics in JSON format:
{
  "testCoverage": 0-100,
  "riskCoverage": 0-100,
  "automationReadiness": 0-100,
  "qualityScore": 0-100
}`;

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: metricsPrompt,
          toolId: "test-generator-metrics",
          requestType: "metrics"
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        try {
          const parsedMetrics = JSON.parse(result.response || '{}');
          if (parsedMetrics.testCoverage !== undefined) {
            setAnalysisMetrics(parsedMetrics);
          }
        } catch (parseError) {
          console.error('Error parsing metrics:', parseError);
        }
      }
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  };

  const exportTests = (format: 'txt' | 'json' | 'excel') => {
    if (!generatedTests && testSuites.length === 0) {
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
        testSuites: testSuites,
        aiInsights: aiInsights,
        metrics: analysisMetrics,
        jiraData: jiraData
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `ai-test-suite-${Date.now()}.json`;
    } else if (format === 'excel') {
      content = generateExcelFormat();
      mimeType = 'text/csv';
      filename = `test-suite-${Date.now()}.csv`;
    } else {
      content = generateProfessionalReport();
      mimeType = 'text/plain';
      filename = `test-cases-report-${Date.now()}.txt`;
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
      description: `Professional test suite exported as ${format.toUpperCase()} file`,
    });
  };

  const generateProfessionalReport = () => {
    return `
# AI-POWERED TEST CASE GENERATION REPORT
Generated on: ${new Date().toLocaleString()}
JIRA Story: ${jiraStoryId}
Quality Score: ${analysisMetrics.qualityScore}/100

## EXECUTIVE SUMMARY
- Test Coverage: ${analysisMetrics.testCoverage}%
- Risk Coverage: ${analysisMetrics.riskCoverage}%
- Automation Readiness: ${analysisMetrics.automationReadiness}%

## AI INSIGHTS
${aiInsights.map(insight => `
### ${insight.title} (${insight.impact} Impact)
${insight.description}
Action Required: ${insight.actionRequired ? 'Yes' : 'No'}
`).join('\n')}

## TEST SUITES
${testSuites.map(suite => `
### ${suite.name}
- Priority: ${suite.priority}
- Category: ${suite.category}
- Coverage: ${suite.coverage}%
- Estimated Time: ${suite.estimatedExecutionTime}
- Test Cases: ${suite.testCases.length}
`).join('\n')}

## GENERATED TEST CASES
${generatedTests}

---
Generated by AI-Powered Test Generator
    `.trim();
  };

  const generateExcelFormat = () => {
    return `Test Suite,Test Case ID,Title,Priority,Category,Automation Ready,Estimated Time
${testSuites.map(suite => 
      suite.testCases.map(tc => 
        `${suite.name},${tc.id},${tc.title},${tc.priority},${tc.category},${tc.automationCandidate},30min`
      ).join('\n')
    ).join('\n')}`;
  };

  const createInQTestHandler = async () => {
    if (!generatedTests && testSuites.length === 0) {
      toast({
        title: "Error",
        description: "Please generate test cases first.",
        variant: "destructive",
      });
      return;
    }

    const testData = {
      generatedTests: generatedTests,
      testSuites: testSuites,
      aiInsights: aiInsights,
      metrics: analysisMetrics,
      jiraData: jiraData,
      timestamp: new Date().toISOString()
    };
    
    await createInQTest(testData, "test-generator", "test cases");
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
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">AI-Powered Test Generator</span>
                <div className="text-sm text-gray-600 flex items-center space-x-2">
                  <Badge variant="outline" className="bg-purple-100 text-purple-700">AI Enhanced</Badge>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700">AC Analysis</Badge>
                  {jiraData && (
                    <Badge variant="secondary">
                      Jira: {jiraData.key || jiraData.id}
                      {jiraData.acceptanceCriteria && jiraData.acceptanceCriteria.length > 0 && (
                        <span className="ml-1 text-green-600">({jiraData.acceptanceCriteria.length} AC)</span>
                      )}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <InfoPopover
              title="AI-Powered Test Generation with AC Analysis"
              content="Generate comprehensive test suites with AI-driven insights, acceptance criteria analysis, risk assessment, and automation recommendations."
              steps={[
                "Enter JIRA Story ID or requirements",
                "AI extracts and analyzes acceptance criteria",
                "Generates structured test cases based on AC",
                "Review AI insights and recommendations",
                "Export professional test documentation"
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Advanced AI-powered test case generation with intelligent acceptance criteria analysis, risk assessment, and automation recommendations.
          </p>
          
          {/* Show AC preview if available */}
          {jiraData && jiraData.acceptanceCriteria && jiraData.acceptanceCriteria.length > 0 && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-400 mb-2">
                {jiraData.acceptanceCriteria.length} Acceptance Criteria Ready for Analysis
              </h4>
              <div className="text-sm text-green-700 dark:text-green-300">
                AC will be automatically analyzed to generate comprehensive test cases
              </div>
            </div>
          )}
          
          {analysisMetrics.qualityScore > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{analysisMetrics.testCoverage}%</div>
                <div className="text-xs text-green-700">Test Coverage</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{analysisMetrics.riskCoverage}%</div>
                <div className="text-xs text-blue-700">Risk Coverage</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{analysisMetrics.automationReadiness}%</div>
                <div className="text-xs text-purple-700">Automation Ready</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">{analysisMetrics.qualityScore}</div>
                <div className="text-xs text-orange-700">Quality Score</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="suites">Test Suites</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
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
                    rows={6}
                  />
                </div>
                
                <Button 
                  onClick={handleGenerateTests}
                  disabled={(!jiraStoryId.trim() && !testRequirements.trim()) || isLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  {isLoading ? (
                    <Zap className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? "AI is Analyzing..." : "Generate AI-Powered Tests"}
                </Button>

                {generatedTests && (
                  <div className="space-y-2">
                    <Label>Generated Test Cases</Label>
                    <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap">{generatedTests}</pre>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span>AI Insights & Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiInsights.length > 0 ? (
                <div className="space-y-4">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          insight.impact === 'High' ? 'bg-red-500' :
                          insight.impact === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold">{insight.title}</h4>
                            <Badge variant={insight.actionRequired ? 'destructive' : 'secondary'}>
                              {insight.impact} Impact
                            </Badge>
                            {insight.actionRequired && (
                              <Badge variant="outline">Action Required</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Generate test cases to see AI insights and recommendations.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>Structured Test Suites</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testSuites.length > 0 ? (
                <div className="space-y-4">
                  {testSuites.map((suite) => (
                    <div key={suite.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{suite.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant={suite.priority === 'Critical' ? 'destructive' : 'secondary'}>
                            {suite.priority}
                          </Badge>
                          <Badge variant="outline">{suite.category}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{suite.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Coverage:</span> {suite.coverage}%
                        </div>
                        <div>
                          <span className="font-medium">Risk:</span> {suite.riskLevel}
                        </div>
                        <div>
                          <span className="font-medium">Test Cases:</span> {suite.testCases.length}
                        </div>
                        <div>
                          <span className="font-medium">Est. Time:</span> {suite.estimatedExecutionTime}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Generate test cases to see structured test suites.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-purple-500" />
                <span>Professional Export Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => exportTests('txt')} variant="outline" className="h-20 flex-col">
                  <FileText className="w-6 h-6 mb-2" />
                  <span>Professional Report</span>
                  <span className="text-xs text-muted-foreground">Comprehensive TXT report</span>
                </Button>
                <Button onClick={() => exportTests('json')} variant="outline" className="h-20 flex-col">
                  <FileCode className="w-6 h-6 mb-2" />
                  <span>Structured Data</span>
                  <span className="text-xs text-muted-foreground">JSON with AI insights</span>
                </Button>
                <Button onClick={() => exportTests('excel')} variant="outline" className="h-20 flex-col">
                  <TrendingUp className="w-6 h-6 mb-2" />
                  <span>Test Matrix</span>
                  <span className="text-xs text-muted-foreground">CSV for spreadsheets</span>
                </Button>
                <Button 
                  onClick={createInQTestHandler}
                  disabled={isCreatingQTest || (!generatedTests && testSuites.length === 0)}
                  variant="outline" 
                  className="h-20 flex-col bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 dark:border-blue-700"
                >
                  {isCreatingQTest ? (
                    <TestTube className="w-6 h-6 mb-2 animate-spin" />
                  ) : (
                    <TestTube className="w-6 h-6 mb-2" />
                  )}
                  <span>{isCreatingQTest ? "Creating..." : "Create in QTest"}</span>
                  <span className="text-xs text-muted-foreground">Enhanced QTest cases</span>
                </Button>
                <Button 
                  onClick={createJiraTicket}
                  disabled={isCreatingJira || !generatedTests}
                  variant="outline" 
                  className="h-20 flex-col"
                >
                  {isCreatingJira ? (
                    <Send className="w-6 h-6 mb-2 animate-spin" />
                  ) : (
                    <Send className="w-6 h-6 mb-2" />
                  )}
                  <span>{isCreatingJira ? "Creating..." : "Create in Jira"}</span>
                  <span className="text-xs text-muted-foreground">Enhanced JIRA ticket</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

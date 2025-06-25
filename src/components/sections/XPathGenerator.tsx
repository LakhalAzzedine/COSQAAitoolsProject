import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Code, Zap, Copy, Download, FileText, Target, Brain, Shield, Search, CheckCircle2 } from "lucide-react";
import { InfoPopover } from "@/components/ui/info-popover";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl, buildPromptWithContext } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";

interface XPathGeneratorProps {
  jiraData?: any;
  urlData?: any;
  onConfigOpen: () => void;
}

interface XPathSuggestion {
  type: 'absolute' | 'relative' | 'robust' | 'css';
  xpath: string;
  description: string;
  reliability: 'High' | 'Medium' | 'Low';
  useCase: string;
  advantages: string[];
  disadvantages: string[];
}

interface XPathAnalysis {
  elementType: string;
  complexity: 'Simple' | 'Moderate' | 'Complex';
  automationReadiness: number;
  maintenanceRisk: 'Low' | 'Medium' | 'High';
  recommendations: string[];
  bestPractices: string[];
}

export function XPathGenerator({ jiraData, urlData, onConfigOpen }: XPathGeneratorProps) {
  const [htmlContent, setHtmlContent] = useState("");
  const [targetElement, setTargetElement] = useState("");
  const [generatedXPaths, setGeneratedXPaths] = useState("");
  const [xpathSuggestions, setXpathSuggestions] = useState<XPathSuggestion[]>([]);
  const [xpathAnalysis, setXpathAnalysis] = useState<XPathAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("generator");
  const { toast } = useToast();

  const handleGenerateXPath = async () => {
    if (!htmlContent.trim() && !targetElement.trim()) {
      toast({
        title: "Error",
        description: "Please provide HTML content or describe the target element.",
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

      const endpointUrl = getToolEndpointUrl("xpath-generator", config);
      
      const contentToAnalyze = htmlContent || targetElement;
      const prompt = buildPromptWithContext("xpath-generator", contentToAnalyze, jiraData, urlData);
      
      console.log(`Generating AI-powered XPath selectors via ${endpointUrl}`);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          htmlContent: htmlContent,
          targetElement: targetElement,
          toolId: "xpath-generator",
          jiraData: jiraData,
          urlData: urlData,
          aiEnhanced: true,
          includeSuggestions: true,
          includeAnalysis: true,
          includeValidation: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("AI XPath generation response:", result);
      
      const xpathText = result.response || result.xpaths || result.data?.response || result.data?.xpaths || "No XPath selectors generated";
      
      setGeneratedXPaths(xpathText);
      
      // Parse structured response from LLM
      if (result.suggestions && Array.isArray(result.suggestions)) {
        setXpathSuggestions(result.suggestions);
      } else {
        await generateXPathSuggestions(contentToAnalyze);
      }
      
      if (result.analysis) {
        setXpathAnalysis(result.analysis);
      } else {
        await generateXPathAnalysis(contentToAnalyze);
      }
      
      toast({
        title: "AI-Powered XPath Generation Complete",
        description: "Professional XPath selectors generated with validation and best practices",
      });
      
    } catch (error) {
      console.error('Error generating XPath:', error);
      toast({
        title: "Error",
        description: "Could not generate XPath selectors. Check your backend configuration and connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateXPathSuggestions = async (content: string) => {
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("xpath-generator", config);
      
      const suggestionsPrompt = `Analyze the following HTML content and provide multiple XPath suggestions with different approaches:

HTML Content:
${content}

${jiraData ? `\nJira Context:\nStory: ${jiraData.summary}\nDescription: ${jiraData.description}` : ''}
${urlData ? `\nURL Context:\nPage: ${urlData.title}\nContent: ${urlData.content}` : ''}

Please provide structured XPath suggestions in JSON format with:
- Absolute XPath
- Relative XPath using attributes
- Robust XPath using text or unique identifiers
- CSS selector equivalent
- Reliability rating and use cases for each`;

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: suggestionsPrompt,
          toolId: "xpath-generator-suggestions",
          requestType: "xpath-suggestions"
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        try {
          const parsedSuggestions = JSON.parse(result.response || '{"suggestions": []}');
          if (parsedSuggestions.suggestions) {
            setXpathSuggestions(parsedSuggestions.suggestions);
          }
        } catch (parseError) {
          console.error('Error parsing XPath suggestions:', parseError);
        }
      }
    } catch (error) {
      console.error('Error generating XPath suggestions:', error);
    }
  };

  const generateXPathAnalysis = async (content: string) => {
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("xpath-generator", config);
      
      const analysisPrompt = `Analyze the following HTML content and provide XPath analysis including:

HTML Content:
${content}

${jiraData ? `\nJira Context:\nStory: ${jiraData.summary}\nDescription: ${jiraData.description}` : ''}
${urlData ? `\nURL Context:\nPage: ${urlData.title}\nContent: ${urlData.content}` : ''}

Please provide analysis in JSON format with:
- Element type and complexity assessment
- Automation readiness score (0-100)
- Maintenance risk level
- Specific recommendations
- Best practices for this element type`;

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: analysisPrompt,
          toolId: "xpath-generator-analysis",
          requestType: "xpath-analysis"
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        try {
          const parsedAnalysis = JSON.parse(result.response || '{}');
          if (parsedAnalysis.elementType) {
            setXpathAnalysis(parsedAnalysis);
          }
        } catch (parseError) {
          console.error('Error parsing XPath analysis:', parseError);
        }
      }
    } catch (error) {
      console.error('Error generating XPath analysis:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "XPath selector copied to clipboard",
    });
  };

  const exportXPaths = (format: 'txt' | 'json' | 'csv') => {
    if (!generatedXPaths && xpathSuggestions.length === 0) {
      toast({
        title: "Error",
        description: "Please generate XPath selectors first.",
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
        htmlContent: htmlContent,
        targetElement: targetElement,
        generatedXPaths: generatedXPaths,
        xpathSuggestions: xpathSuggestions,
        xpathAnalysis: xpathAnalysis,
        jiraData: jiraData,
        urlData: urlData
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `xpath-selectors-${Date.now()}.json`;
    } else if (format === 'csv') {
      const headers = 'Type,XPath,Reliability,Use Case,Description\n';
      const rows = xpathSuggestions.map(suggestion => 
        `"${suggestion.type}","${suggestion.xpath}","${suggestion.reliability}","${suggestion.useCase}","${suggestion.description}"`
      ).join('\n');
      content = headers + rows;
      mimeType = 'text/csv';
      filename = `xpath-selectors-${Date.now()}.csv`;
    } else {
      content = `
# AI-POWERED XPATH SELECTOR GENERATION REPORT
Generated on: ${new Date().toLocaleString()}

## ANALYSIS SUMMARY
${xpathAnalysis ? `
Element Type: ${xpathAnalysis.elementType}
Complexity: ${xpathAnalysis.complexity}
Automation Readiness: ${xpathAnalysis.automationReadiness}%
Maintenance Risk: ${xpathAnalysis.maintenanceRisk}
` : ''}

## CONTEXT INFORMATION
${jiraData ? `Jira Story: ${jiraData.summary}` : 'No Jira context'}
${urlData ? `URL Source: ${urlData.title}` : 'No URL context'}

## XPATH SUGGESTIONS
${xpathSuggestions.map(suggestion => `
### ${suggestion.type.toUpperCase()} XPATH
XPath: ${suggestion.xpath}
Reliability: ${suggestion.reliability}
Use Case: ${suggestion.useCase}
Description: ${suggestion.description}
Advantages: ${suggestion.advantages?.join(', ') || 'N/A'}
Disadvantages: ${suggestion.disadvantages?.join(', ') || 'N/A'}
`).join('\n')}

## RECOMMENDATIONS
${xpathAnalysis?.recommendations?.map(rec => `• ${rec}`).join('\n') || 'No specific recommendations available'}

## BEST PRACTICES
${xpathAnalysis?.bestPractices?.map(practice => `• ${practice}`).join('\n') || 'No specific best practices available'}

## GENERATED XPATH OUTPUT
${generatedXPaths}

---
Generated by AI-Powered XPath Generator
Professional Automation Tool
      `.trim();
      mimeType = 'text/plain';
      filename = `xpath-report-${Date.now()}.txt`;
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
      description: `Professional XPath report exported as ${format.toUpperCase()} file`,
    });
  };

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'High': return 'bg-green-100 text-green-700 border-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Low': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">AI-Powered XPath Generator</span>
                <div className="text-sm text-gray-600 flex items-center space-x-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700">AI Enhanced</Badge>
                  <Badge variant="outline" className="bg-indigo-100 text-indigo-700">Automation Ready</Badge>
                  {jiraData && (
                    <Badge variant="secondary">Jira: {jiraData.id}</Badge>
                  )}
                  {urlData && (
                    <Badge variant="secondary">URL: {urlData.title}</Badge>
                  )}
                </div>
              </div>
            </div>
            <InfoPopover
              title="AI-Powered XPath Generation"
              content="Generate robust, maintainable XPath selectors with AI-driven validation and best practices recommendations."
              steps={[
                "Provide HTML content or describe target element",
                "AI analyzes and generates multiple XPath approaches",
                "Review suggestions with reliability ratings",
                "Get automation readiness analysis",
                "Export professional XPath documentation"
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Professional XPath selector generation with AI-powered analysis, validation, and automation best practices.
          </p>
          
          {xpathAnalysis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-lg font-bold text-blue-600">{xpathAnalysis.elementType}</div>
                <div className="text-xs text-blue-700">Element Type</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{xpathAnalysis.automationReadiness}%</div>
                <div className="text-xs text-green-700">Automation Ready</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-lg font-bold text-purple-600">{xpathAnalysis.complexity}</div>
                <div className="text-xs text-purple-700">Complexity</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-lg font-bold text-orange-600">{xpathAnalysis.maintenanceRisk}</div>
                <div className="text-xs text-orange-700">Maintenance Risk</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="html-content">HTML Content</Label>
                  <Textarea
                    id="html-content"
                    placeholder="Paste HTML content here..."
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    rows={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-element">Target Element Description (Alternative)</Label>
                  <Input
                    id="target-element"
                    placeholder="Describe the element you want to target (e.g., 'Submit button with blue background')"
                    value={targetElement}
                    onChange={(e) => setTargetElement(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleGenerateXPath}
                  disabled={(!htmlContent.trim() && !targetElement.trim()) || isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  {isLoading ? (
                    <Zap className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? "AI is Analyzing..." : "Generate AI-Powered XPath"}
                </Button>

                {generatedXPaths && (
                  <div className="space-y-2">
                    <Label>Generated XPath Selectors</Label>
                    <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap">{generatedXPaths}</pre>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span>XPath Suggestions & Alternatives</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {xpathSuggestions.length > 0 ? (
                <div className="space-y-4">
                  {xpathSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold capitalize">{suggestion.type} XPath</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getReliabilityColor(suggestion.reliability)}>
                            {suggestion.reliability} Reliability
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(suggestion.xpath)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded font-mono text-sm mb-3">
                        {suggestion.xpath}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                      
                      <div className="text-sm">
                        <span className="font-medium">Use Case:</span> {suggestion.useCase}
                      </div>
                      
                      {suggestion.advantages && suggestion.advantages.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-green-600">Advantages:</span>
                          <ul className="text-sm text-green-600 ml-4">
                            {suggestion.advantages.map((advantage, idx) => (
                              <li key={idx}>• {advantage}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {suggestion.disadvantages && suggestion.disadvantages.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-red-600">Disadvantages:</span>
                          <ul className="text-sm text-red-600 ml-4">
                            {suggestion.disadvantages.map((disadvantage, idx) => (
                              <li key={idx}>• {disadvantage}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Generate XPath selectors to see AI-powered suggestions and alternatives.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-green-500" />
                <span>Automation Analysis & Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {xpathAnalysis ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Element Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Type:</span> {xpathAnalysis.elementType}</div>
                        <div><span className="font-medium">Complexity:</span> {xpathAnalysis.complexity}</div>
                        <div><span className="font-medium">Automation Readiness:</span> {xpathAnalysis.automationReadiness}%</div>
                        <div><span className="font-medium">Maintenance Risk:</span> {xpathAnalysis.maintenanceRisk}</div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Quality Indicators</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm">AI-Validated Selectors</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">Reliability Tested</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-purple-500" />
                          <span className="text-sm">Automation Optimized</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {xpathAnalysis.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-500 font-bold">•</span>
                          <span className="text-sm">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Best Practices</h4>
                    <ul className="space-y-1">
                      {xpathAnalysis.bestPractices.map((practice, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-green-500 font-bold">•</span>
                          <span className="text-sm">{practice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Generate XPath selectors to see automation analysis and recommendations.</p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => exportXPaths('txt')} variant="outline" className="h-20 flex-col">
                  <FileText className="w-6 h-6 mb-2" />
                  <span>Professional Report</span>
                  <span className="text-xs text-muted-foreground">Comprehensive analysis</span>
                </Button>
                <Button onClick={() => exportXPaths('json')} variant="outline" className="h-20 flex-col">
                  <Code className="w-6 h-6 mb-2" />
                  <span>Structured Data</span>
                  <span className="text-xs text-muted-foreground">JSON with analysis</span>
                </Button>
                <Button onClick={() => exportXPaths('csv')} variant="outline" className="h-20 flex-col">
                  <Target className="w-6 h-6 mb-2" />
                  <span>Selector Matrix</span>
                  <span className="text-xs text-muted-foreground">CSV for automation</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

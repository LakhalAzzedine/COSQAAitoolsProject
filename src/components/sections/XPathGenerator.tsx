
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Code, Zap, Download, FileText, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InfoPopover } from "@/components/ui/info-popover";
import { getToolEndpointUrl, buildPromptWithContext } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";
import { XPathGenerator as XPathUtil, xpathBestPractices, XPathValidationResult } from "@/utils/xpathUtils";

interface XPathGeneratorProps {
  jiraData?: any;
  urlData?: any;
}

export function XPathGenerator({ jiraData, urlData }: XPathGeneratorProps) {
  const [htmlContent, setHtmlContent] = useState("");
  const [generatedXPaths, setGeneratedXPaths] = useState<{ strategy: string; xpaths: string[] }[]>([]);
  const [validationResults, setValidationResults] = useState<XPathValidationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedXPaths, setSelectedXPaths] = useState<string[]>([]);
  const { toast } = useToast();

  const xpathUtil = new XPathUtil();

  const handleGenerateXPath = async () => {
    if (!htmlContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter HTML content to generate XPath selectors.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Generate XPath using local utility first
      const localResults = xpathUtil.generateXPaths(htmlContent);
      setGeneratedXPaths(localResults);

      // Validate generated XPaths
      const allXPaths = localResults.flatMap(result => result.xpaths);
      const validations = allXPaths.map(xpath => xpathUtil.validateXPath(xpath, htmlContent));
      setValidationResults(validations);

      // Also try backend generation for enhanced results
      try {
        const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
        let config = defaultEndpointConfig;
        
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig);
          config = { ...defaultEndpointConfig, ...parsedConfig };
        }

        const endpointUrl = getToolEndpointUrl("xpath-generator", config);
        const prompt = buildPromptWithContext("xpath-generator", htmlContent, jiraData, urlData);
        
        console.log(`Enhancing XPath generation via ${endpointUrl}`);
        
        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            htmlContent: htmlContent,
            toolId: "xpath-generator",
            localResults: localResults
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          const backendXPaths = result.response || result.xpath || "";
          
          if (backendXPaths) {
            // Merge backend results with local results
            const enhancedResults = [...localResults];
            if (!enhancedResults.some(r => r.strategy === "AI-Enhanced")) {
              enhancedResults.push({
                strategy: "AI-Enhanced",
                xpaths: backendXPaths.split('\n').filter((xpath: string) => xpath.trim().startsWith('//') || xpath.trim().startsWith('/'))
              });
            }
            setGeneratedXPaths(enhancedResults);
          }
        }
      } catch (error) {
        console.log('Backend enhancement failed, using local results only');
      }
      
      toast({
        title: "XPath Generated",
        description: `Generated ${localResults.reduce((total, result) => total + result.xpaths.length, 0)} XPath selectors`,
      });
      
    } catch (error) {
      console.error('Error generating XPath:', error);
      toast({
        title: "Error",
        description: "Could not generate XPath selectors.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleXPathSelection = (xpath: string) => {
    setSelectedXPaths(prev => 
      prev.includes(xpath) 
        ? prev.filter(x => x !== xpath)
        : [...prev, xpath]
    );
  };

  const exportXPath = (format: 'txt' | 'json' | 'csv') => {
    if (generatedXPaths.length === 0) {
      toast({
        title: "Error",
        description: "Please generate XPath first.",
        variant: "destructive",
      });
      return;
    }

    let content: string;
    let mimeType: string;
    let filename: string;

    const dataToExport = selectedXPaths.length > 0 ? 
      generatedXPaths.map(result => ({
        ...result,
        xpaths: result.xpaths.filter(xpath => selectedXPaths.includes(xpath))
      })).filter(result => result.xpaths.length > 0) : 
      generatedXPaths;

    if (format === 'json') {
      const exportData = {
        timestamp: new Date().toISOString(),
        htmlContent: htmlContent,
        results: dataToExport,
        validations: validationResults,
        bestPractices: xpathBestPractices,
        jiraData: jiraData,
        urlData: urlData
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `xpath-selectors-${Date.now()}.json`;
    } else if (format === 'csv') {
      const headers = 'Strategy,XPath,Specificity,Robustness,Maintainability,Issues,Suggestions\n';
      const rows = dataToExport.flatMap(result => 
        result.xpaths.map(xpath => {
          const validation = validationResults.find(v => v.xpath === xpath);
          return `"${result.strategy}","${xpath}","${validation?.specificity || 0}","${validation?.robustness || 0}","${validation?.maintainability || 0}","${validation?.issues.join('; ') || ''}","${validation?.suggestions.join('; ') || ''}"`;
        })
      ).join('\n');
      content = headers + rows;
      mimeType = 'text/csv';
      filename = `xpath-selectors-${Date.now()}.csv`;
    } else {
      content = `XPath Selectors Generated on: ${new Date().toLocaleString()}\n\n`;
      content += `HTML Content:\n${htmlContent}\n\n`;
      content += `Generated XPath Selectors:\n\n`;
      
      dataToExport.forEach(result => {
        content += `\n=== ${result.strategy} Strategy ===\n`;
        result.xpaths.forEach((xpath, index) => {
          const validation = validationResults.find(v => v.xpath === xpath);
          content += `${index + 1}. ${xpath}\n`;
          if (validation) {
            content += `   Specificity: ${validation.specificity}/10, Robustness: ${validation.robustness}/10\n`;
            if (validation.issues.length > 0) {
              content += `   Issues: ${validation.issues.join(', ')}\n`;
            }
            if (validation.suggestions.length > 0) {
              content += `   Suggestions: ${validation.suggestions.join(', ')}\n`;
            }
          }
        });
      });
      
      content += `\n\nBest Practices:\n`;
      xpathBestPractices.forEach((practice, index) => {
        content += `${index + 1}. ${practice}\n`;
      });
      
      mimeType = 'text/plain';
      filename = `xpath-selectors-${Date.now()}.txt`;
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
      description: `XPath selectors exported as ${format.toUpperCase()} file`,
    });
  };

  const getValidationIcon = (validation?: XPathValidationResult) => {
    if (!validation) return <Info className="w-4 h-4 text-gray-400" />;
    
    const overallScore = (validation.specificity + validation.robustness + validation.maintainability) / 3;
    
    if (overallScore >= 7) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (overallScore >= 4) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
                <Code className="w-4 h-4 text-white" />
              </div>
              <span>🚀 Advanced XPath Generator</span>
              {jiraData && (
                <Badge variant="secondary">Jira: {jiraData.id}</Badge>
              )}
              {urlData && (
                <Badge variant="secondary">URL: {urlData.title}</Badge>
              )}
            </div>
            <InfoPopover
              title="Advanced XPath Generator"
              content="Generate robust XPath selectors with validation and best practices guidance."
              steps={[
                "Paste HTML content into the text area",
                "Click 'Generate XPath' to create multiple strategies",
                "Review validation scores and recommendations",
                "Select best XPaths and export results"
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            🔧 Generate robust XPath selectors with multiple strategies, validation, and best practices guidance.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="html-content">HTML Content</Label>
              <Textarea
                id="html-content"
                placeholder="Paste your HTML content here to generate XPath selectors..."
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleGenerateXPath}
                disabled={!htmlContent.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                {isLoading ? "Generating XPath..." : "🎯 Generate XPath"}
              </Button>
              
              {generatedXPaths.length > 0 && (
                <div className="flex gap-2">
                  <Button onClick={() => exportXPath('txt')} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    TXT
                  </Button>
                  <Button onClick={() => exportXPath('json')} variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    JSON
                  </Button>
                  <Button onClick={() => exportXPath('csv')} variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {generatedXPaths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">✨ Generated XPath Selectors</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="results" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="results">XPath Results</TabsTrigger>
                <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
              </TabsList>
              
              <TabsContent value="results" className="space-y-4">
                {generatedXPaths.map((result, resultIndex) => (
                  <Card key={resultIndex} className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>📋 {result.strategy} Strategy</span>
                        <Badge variant="outline">{result.xpaths.length} XPaths</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.xpaths.map((xpath, xpathIndex) => {
                          const validation = validationResults.find(v => v.xpath === xpath);
                          const isSelected = selectedXPaths.includes(xpath);
                          
                          return (
                            <div 
                              key={xpathIndex} 
                              className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                                isSelected ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => toggleXPathSelection(xpath)}
                            >
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => {}} // Handled by div click
                                className="rounded"
                              />
                              {getValidationIcon(validation)}
                              <code className="flex-1 text-sm bg-gray-100 px-2 py-1 rounded">
                                {xpath}
                              </code>
                              {validation && (
                                <div className="flex space-x-1 text-xs">
                                  <span className="bg-blue-100 px-2 py-1 rounded">
                                    S: {validation.specificity}
                                  </span>
                                  <span className="bg-green-100 px-2 py-1 rounded">
                                    R: {validation.robustness}
                                  </span>
                                  <span className="bg-purple-100 px-2 py-1 rounded">
                                    M: {validation.maintainability}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {selectedXPaths.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      ✅ Selected {selectedXPaths.length} XPath(s). Use export buttons to save selected XPaths only.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="best-practices" className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">📚 XPath Best Practices</h3>
                  {xpathBestPractices.map((practice, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-gray-50 rounded">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-sm text-gray-700">{practice}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">🔍 Validation Metrics Explained</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong className="text-blue-600">Specificity (S)</strong>
                      <p className="text-gray-600">How precisely the XPath targets elements</p>
                    </div>
                    <div>
                      <strong className="text-green-600">Robustness (R)</strong>
                      <p className="text-gray-600">Resistance to DOM changes</p>
                    </div>
                    <div>
                      <strong className="text-purple-600">Maintainability (M)</strong>
                      <p className="text-gray-600">Ease of understanding and updating</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

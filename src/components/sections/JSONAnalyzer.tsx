
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileJson, Zap, Download, Eye, FileText, Send, GitCompare, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { InfoPopover } from "@/components/ui/info-popover";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";
import { analyzeJSON, formatAnalysisReport } from "@/utils/jsonAnalysis";

interface JSONAnalyzerProps {
  jiraData?: any;
}

export function JSONAnalyzer({ jiraData }: JSONAnalyzerProps) {
  const [jsonInput1, setJsonInput1] = useState("");
  const [jsonInput2, setJsonInput2] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingJira, setIsCreatingJira] = useState(false);
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

  const exportReport = (format: 'txt' | 'json') => {
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
        inputs: {
          primary: jsonInput1,
          ...(compareMode && jsonInput2 && { secondary: jsonInput2 })
        },
        jiraData: jiraData
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `json-analysis-${Date.now()}.json`;
    } else {
      content = formatAnalysisReport(analysisResult, jsonInput1, compareMode ? jsonInput2 : undefined);
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
          action: "createTicket",
          analysis: formatAnalysisReport(analysisResult, jsonInput1, compareMode ? jsonInput2 : undefined),
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
        description: `JSON test scenarios created in Jira: ${result.issueKey || 'Success'}`,
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

  const renderAnalysisResults = () => {
    if (!analysisResult) return null;

    return (
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          {analysisResult.comparison && <TabsTrigger value="comparison">Comparison</TabsTrigger>}
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
      </Tabs>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
                <FileJson className="w-4 h-4 text-white" />
              </div>
              <span>JSON Analyzer</span>
              {jiraData && (
                <Badge variant="secondary">Jira: {jiraData.id}</Badge>
              )}
            </div>
            <InfoPopover
              title="How to use JSON Analyzer"
              content="Comprehensive JSON analysis tool for structure validation, schema generation, and comparison."
              steps={[
                "Paste your JSON data in the primary input field",
                "Enable comparison mode to compare two JSON structures",
                "Click 'Analyze JSON' to get detailed analysis",
                "Review structure, validation, schema, and comparison results",
                "Export analysis report or generate test scenarios"
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Advanced JSON analysis with structure validation, schema generation, statistics, and comparison capabilities.
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

            {analysisResult && (
              <div className="space-y-4">
                {renderAnalysisResults()}
                
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

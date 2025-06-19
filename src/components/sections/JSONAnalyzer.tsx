import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileJson, Download, Zap, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl, buildPromptWithContext } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";

interface JSONAnalyzerProps {
  jiraData?: any;
}

interface AnalysisResult {
  field: string;
  json1Value: string;
  json2Value: string;
  comparison: string;
  issues: string;
}

export function JSONAnalyzer({ jiraData }: JSONAnalyzerProps) {
  const [json1Input, setJson1Input] = useState("");
  const [json2Input, setJson2Input] = useState("");
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [llmResponse, setLlmResponse] = useState("");
  const { toast } = useToast();

  const handleAnalyzeJSON = async () => {
    if (!json1Input.trim() || !json2Input.trim()) {
      toast({
        title: "Error",
        description: "Please enter both JSON inputs to analyze.",
        variant: "destructive",
      });
      return;
    }

    // Validate JSON inputs
    try {
      JSON.parse(json1Input);
      JSON.parse(json2Input);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please ensure both inputs contain valid JSON.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Get saved configuration
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("json-analyzer", config);
      const prompt = buildPromptWithContext("json-analyzer", `JSON 1:\n${json1Input}\n\nJSON 2:\n${json2Input}`, jiraData);
      
      console.log(`Analyzing JSON via ${endpointUrl}`);
      console.log("Prompt:", prompt);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          json1: json1Input,
          json2: json2Input,
          toolId: "json-analyzer"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Store the full LLM response for export
      setLlmResponse(result.response || result.analysis || "No analysis provided");
      
      // Parse analysis results if structured data is provided
      if (result.comparisonTable && Array.isArray(result.comparisonTable)) {
        setAnalysisResults(result.comparisonTable);
      } else {
        // Generate a basic comparison table from the JSON structures
        const mockResults = generateBasicComparison(json1Input, json2Input);
        setAnalysisResults(mockResults);
      }
      
      toast({
        title: "Analysis Complete",
        description: `JSON comparison analysis completed successfully`,
      });
      
    } catch (error) {
      console.error('Error analyzing JSON:', error);
      toast({
        title: "Error",
        description: "Could not analyze JSON. Check SVC cluster connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateBasicComparison = (json1: string, json2: string): AnalysisResult[] => {
    try {
      const obj1 = JSON.parse(json1);
      const obj2 = JSON.parse(json2);
      const results: AnalysisResult[] = [];
      
      const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
      
      allKeys.forEach(key => {
        const val1 = obj1[key];
        const val2 = obj2[key];
        const val1Str = val1 !== undefined ? JSON.stringify(val1) : "undefined";
        const val2Str = val2 !== undefined ? JSON.stringify(val2) : "undefined";
        
        let comparison = "Same";
        let issues = "None";
        
        if (val1 === undefined) {
          comparison = "Missing in JSON 1";
          issues = "Field only exists in JSON 2";
        } else if (val2 === undefined) {
          comparison = "Missing in JSON 2";
          issues = "Field only exists in JSON 1";
        } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          comparison = "Different";
          issues = "Values differ between JSONs";
        }
        
        results.push({
          field: key,
          json1Value: val1Str,
          json2Value: val2Str,
          comparison,
          issues
        });
      });
      
      return results;
    } catch (error) {
      return [];
    }
  };

  const exportToHTML = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JSON Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .analysis-section { margin: 20px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; }
        .json-input { background-color: #f1f1f1; padding: 10px; border-radius: 4px; margin: 10px 0; }
        pre { white-space: pre-wrap; word-wrap: break-word; }
    </style>
</head>
<body>
    <div class="header">
        <h1>JSON Analysis Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
    
    <h2>Input JSONs</h2>
    <div class="json-input">
        <h3>JSON 1:</h3>
        <pre>${json1Input}</pre>
    </div>
    <div class="json-input">
        <h3>JSON 2:</h3>
        <pre>${json2Input}</pre>
    </div>
    
    <h2>Comparison Analysis</h2>
    <table>
        <thead>
            <tr>
                <th>Field</th>
                <th>JSON 1 Value</th>
                <th>JSON 2 Value</th>
                <th>Comparison</th>
                <th>Issues</th>
            </tr>
        </thead>
        <tbody>
            ${analysisResults.map(result => `
                <tr>
                    <td>${result.field}</td>
                    <td>${result.json1Value}</td>
                    <td>${result.json2Value}</td>
                    <td>${result.comparison}</td>
                    <td>${result.issues}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="analysis-section">
        <h2>Detailed Analysis</h2>
        <pre>${llmResponse}</pre>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `json-analysis-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "HTML Export",
      description: "Analysis report downloaded as HTML file",
    });
  };

  const exportToJSON = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      inputs: {
        json1: json1Input,
        json2: json2Input
      },
      analysis: llmResponse,
      comparisonTable: analysisResults
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `json-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "JSON Export",
      description: "Analysis data exported as JSON file",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
              <FileJson className="w-4 h-4 text-white" />
            </div>
            <span>JSON Analyzer</span>
            {jiraData && (
              <Badge variant="secondary">Jira: {jiraData.id}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Compare and analyze two JSON structures to identify differences, missing fields, and data inconsistencies.
          </p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="json1">JSON 1</Label>
                <Textarea
                  id="json1"
                  placeholder="Paste your first JSON here..."
                  value={json1Input}
                  onChange={(e) => setJson1Input(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="json2">JSON 2</Label>
                <Textarea
                  id="json2"
                  placeholder="Paste your second JSON here..."
                  value={json2Input}
                  onChange={(e) => setJson2Input(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAnalyzeJSON}
                disabled={!json1Input.trim() || !json2Input.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                {isLoading ? "Analyzing..." : "Analyze JSON"}
              </Button>
              
              {llmResponse && (
                <div className="flex gap-2">
                  <Button onClick={exportToHTML} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export HTML
                  </Button>
                  <Button onClick={exportToJSON} variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {analysisResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comparison Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>JSON 1 Value</TableHead>
                    <TableHead>JSON 2 Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{result.field}</TableCell>
                      <TableCell className="max-w-xs truncate">{result.json1Value}</TableCell>
                      <TableCell className="max-w-xs truncate">{result.json2Value}</TableCell>
                      <TableCell>
                        <Badge variant={result.comparison === "Same" ? "default" : "destructive"}>
                          {result.comparison}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{result.issues}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Response */}
      {llmResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detailed Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">{llmResponse}</pre>
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground">
              <p>Analysis completed successfully. Use the export buttons above to save the results.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

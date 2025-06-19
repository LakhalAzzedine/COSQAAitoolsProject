
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Code, Zap, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl, buildPromptWithContext } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";

interface XPathGeneratorProps {
  jiraData?: any;
  urlData?: any;
}

export function XPathGenerator({ jiraData, urlData }: XPathGeneratorProps) {
  const [htmlContent, setHtmlContent] = useState("");
  const [generatedXPath, setGeneratedXPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("xpath-generator", config);
      const prompt = buildPromptWithContext("xpath-generator", htmlContent, jiraData, urlData);
      
      console.log(`Generating XPath via ${endpointUrl}`);
      console.log("Prompt:", prompt);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          htmlContent: htmlContent,
          toolId: "xpath-generator"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      setGeneratedXPath(result.response || result.xpath || "No XPath generated");
      
      toast({
        title: "XPath Generated",
        description: "XPath selectors have been generated successfully",
      });
      
    } catch (error) {
      console.error('Error generating XPath:', error);
      toast({
        title: "Error",
        description: "Could not generate XPath. Check SVC cluster connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportXPath = (format: 'txt' | 'json') => {
    if (!generatedXPath) {
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

    if (format === 'json') {
      const exportData = {
        timestamp: new Date().toISOString(),
        htmlContent: htmlContent,
        generatedXPath: generatedXPath,
        jiraData: jiraData,
        urlData: urlData
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `xpath-selectors-${Date.now()}.json`;
    } else {
      content = `XPath Selectors Generated on: ${new Date().toLocaleString()}\n\nHTML Content:\n${htmlContent}\n\nGenerated XPath:\n${generatedXPath}`;
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
              <Code className="w-4 h-4 text-white" />
            </div>
            <span>XPath Generator</span>
            {jiraData && (
              <Badge variant="secondary">Jira: {jiraData.id}</Badge>
            )}
            {urlData && (
              <Badge variant="secondary">URL: {urlData.title}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Generate robust XPath selectors for web elements. Provide HTML content to get multiple XPath options.
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
                {isLoading ? "Generating XPath..." : "Generate XPath"}
              </Button>
              
              {generatedXPath && (
                <div className="flex gap-2">
                  <Button onClick={() => exportXPath('txt')} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export TXT
                  </Button>
                  <Button onClick={() => exportXPath('json')} variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {generatedXPath && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generated XPath Selectors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">{generatedXPath}</pre>
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground">
              <p>XPath selectors generated successfully. Use the buttons above to export the results.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, TestTube, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { defaultEndpointConfig, type EndpointConfig } from "@/config/backendConfig";

interface EndpointConfigProps {
  onConfigUpdate?: (config: EndpointConfig) => void;
}

export function EndpointConfig({ onConfigUpdate }: EndpointConfigProps) {
  const [config, setConfig] = useState<EndpointConfig>(defaultEndpointConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "failed">("unknown");
  const { toast } = useToast();

  useEffect(() => {
    // Load saved configuration from localStorage
    const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig({ ...defaultEndpointConfig, ...parsedConfig });
      } catch (error) {
        console.error("Failed to parse saved config:", error);
      }
    }
  }, []);

  const handleConfigChange = (field: keyof EndpointConfig, value: string) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
  };

  const handleSaveConfig = () => {
    try {
      localStorage.setItem("qaToolsEndpointConfig", JSON.stringify(config));
      onConfigUpdate?.(config);
      toast({
        title: "Configuration Saved",
        description: "Endpoint configuration has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed", 
        description: "Failed to save configuration.",
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      // Test the connection to the backend
      const response = await fetch(`${config.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setConnectionStatus("connected");
        toast({
          title: "Connection Successful",
          description: "Successfully connected to the SVC cluster.",
        });
      } else {
        setConnectionStatus("failed");
        toast({
          title: "Connection Failed",
          description: `SVC cluster responded with status: ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus("failed");
      toast({
        title: "Connection Error",
        description: "Failed to connect to SVC cluster. Check the base URL.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>SVC Cluster Endpoint Configuration</span>
          {connectionStatus !== "unknown" && (
            <Badge variant={connectionStatus === "connected" ? "default" : "destructive"}>
              {connectionStatus === "connected" ? "Connected" : "Failed"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="base-url">SVC Cluster Base URL</Label>
          <Input
            id="base-url"
            placeholder="https://your-gke-cluster.com"
            value={config.baseUrl}
            onChange={(e) => handleConfigChange("baseUrl", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Main SVC cluster URL deployed on GKE
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Tool-Specific Endpoints</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-generator">Test Generator</Label>
              <Input
                id="test-generator"
                placeholder="/test-generator"
                value={config.testGeneratorEndpoint}
                onChange={(e) => handleConfigChange("testGeneratorEndpoint", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ac-validator">AC Validator</Label>
              <Input
                id="ac-validator"
                placeholder="/ac-validator"
                value={config.acValidatorEndpoint}
                onChange={(e) => handleConfigChange("acValidatorEndpoint", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="xpath-generator">XPath Generator</Label>
              <Input
                id="xpath-generator"
                placeholder="/xpath-generator"
                value={config.xpathGeneratorEndpoint}
                onChange={(e) => handleConfigChange("xpathGeneratorEndpoint", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="json-analyzer">JSON Analyzer</Label>
              <Input
                id="json-analyzer"
                placeholder="/json-analyzer"
                value={config.jsonAnalyzerEndpoint}
                onChange={(e) => handleConfigChange("jsonAnalyzerEndpoint", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ada-analyzer">ADA Analyzer</Label>
              <Input
                id="ada-analyzer"
                placeholder="/ada-analyzer"
                value={config.adaAnalyzerEndpoint}
                onChange={(e) => handleConfigChange("adaAnalyzerEndpoint", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lighthouse">Lighthouse</Label>
              <Input
                id="lighthouse"
                placeholder="/lighthouse"
                value={config.lighthouseEndpoint}
                onChange={(e) => handleConfigChange("lighthouseEndpoint", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chatbot">QA Chatbot</Label>
              <Input
                id="chatbot"
                placeholder="/chatbot"
                value={config.chatbotEndpoint}
                onChange={(e) => handleConfigChange("chatbotEndpoint", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defect-analyzer">Defect Analyzer</Label>
              <Input
                id="defect-analyzer"
                placeholder="/defect-analyzer"
                value={config.defectAnalyzerEndpoint}
                onChange={(e) => handleConfigChange("defectAnalyzerEndpoint", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="karate-script">Karate Script Writer</Label>
              <Input
                id="karate-script"
                placeholder="/karate-script"
                value={config.karateScriptEndpoint}
                onChange={(e) => handleConfigChange("karateScriptEndpoint", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smartspec-script">SmartSpec Script Writer</Label>
              <Input
                id="smartspec-script"
                placeholder="/smartspec-script"
                value={config.smartspecScriptEndpoint}
                onChange={(e) => handleConfigChange("smartspecScriptEndpoint", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jira-integration">Jira Integration</Label>
              <Input
                id="jira-integration"
                placeholder="/jira-integration"
                value={config.jiraIntegrationEndpoint}
                onChange={(e) => handleConfigChange("jiraIntegrationEndpoint", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url-processing">URL Processing</Label>
              <Input
                id="url-processing"
                placeholder="/url-processing"
                value={config.urlProcessingEndpoint}
                onChange={(e) => handleConfigChange("urlProcessingEndpoint", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button onClick={handleSaveConfig} className="flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleTestConnection}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <TestTube className="w-4 h-4" />
            <span>{isLoading ? "Testing..." : "Test Connection"}</span>
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-800 mb-2">SVC Cluster Integration Guide</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Set your GKE cluster base URL (e.g., https://your-cluster.com)</li>
                <li>• Configure individual endpoint paths for each QA tool</li>
                <li>• Each tool will send requests to its specific endpoint on your cluster</li>
                <li>• Test the connection to verify your SVC cluster is accessible</li>
                <li>• Ensure your cluster accepts POST requests with JSON payloads</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

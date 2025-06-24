import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCode, Zap, Download, FileText, Send, Settings, Layers } from "lucide-react";
import { InfoPopover } from "@/components/ui/info-popover";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl, buildPromptWithContext } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";
import { SmartSpecEndpointManager } from "./smartspec/SmartSpecEndpointManager";
import { SmartSpecTemplateLibrary } from "./smartspec/SmartSpecTemplateLibrary";

interface UIElement {
  id: string;
  name: string;
  selector: string;
  selectorType: string;
  page: string;
  description: string;
  elementType: string;
  expectedBehavior: string;
}

interface SmartSpecScriptWriterProps {
  jiraData?: any;
  onConfigOpen: () => void;
}

export function SmartSpecScriptWriter({ jiraData, onConfigOpen }: SmartSpecScriptWriterProps) {
  const [jiraStoryId, setJiraStoryId] = useState("");
  const [generatedScripts, setGeneratedScripts] = useState("");
  const [customRequirements, setCustomRequirements] = useState("");
  const [uiElements, setUiElements] = useState<UIElement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingJira, setIsCreatingJira] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const { toast } = useToast();

  const handleTemplateSelect = (template: string) => {
    setGeneratedScripts(template);
    setActiveTab("generate");
    toast({
      title: "Template Applied",
      description: "Template has been loaded into the script editor",
    });
  };

  const handleGenerateScripts = async () => {
    if (!jiraStoryId.trim() && !customRequirements.trim()) {
      toast({
        title: "Error",
        description: "Please enter either a JIRA Story ID or custom requirements.",
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
      let contentToAnalyze = customRequirements;
      
      // Fetch JIRA story details if provided
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
            toolId: "smartspec-script-writer"
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

        contentToAnalyze = `${enhancedJiraData.title}\n\n${enhancedJiraData.description}`;
      }

      // Add UI elements context to the content
      if (uiElements.length > 0) {
        const elementsContext = uiElements.map(el => 
          `UI Element: ${el.name} (${el.elementType}) on ${el.page}\n` +
          `Selector: ${el.selector} (${el.selectorType})\n` +
          `Description: ${el.description}\n` +
          `Expected Behavior: ${el.expectedBehavior}\n`
        ).join('\n');
        
        contentToAnalyze += `\n\nUI Elements Context:\n${elementsContext}`;
      }

      // Generate SmartSpec scripts
      const endpointUrl = getToolEndpointUrl("smartspec-script-writer", config);
      
      const enhancedPrompt = buildPromptWithContext("smartspec-script-writer", contentToAnalyze, {
        ...enhancedJiraData,
        uiElements,
        customRequirements,
        additionalContext: "Generate comprehensive BDD Gherkin scenarios for UI testing using SmartSpec framework. Include Given-When-Then scenarios, background steps, and data-driven examples where appropriate."
      });
      
      console.log(`Generating SmartSpec scripts via ${endpointUrl}`);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          requirements: contentToAnalyze,
          toolId: "smartspec-script-writer",
          jiraId: jiraStoryId,
          jiraData: enhancedJiraData,
          uiElements: uiElements,
          customRequirements: customRequirements
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("SmartSpec script generation response:", result);
      
      const scriptsText = result.response || result.scripts || result.data?.response || result.data?.scripts || "No SmartSpec scripts generated";
      
      setGeneratedScripts(scriptsText);
      
      toast({
        title: "SmartSpec Scripts Generated",
        description: `BDD Gherkin scenarios generated successfully`,
      });
      
    } catch (error) {
      console.error('Error generating SmartSpec scripts:', error);
      toast({
        title: "Error",
        description: "Could not generate SmartSpec scripts. Check your backend configuration and connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportScripts = (format: 'feature' | 'json') => {
    if (!generatedScripts) {
      toast({
        title: "Error",
        description: "Please generate SmartSpec scripts first.",
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
        customRequirements: customRequirements,
        uiElements: uiElements,
        generatedScripts: generatedScripts,
        jiraData: jiraData
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `smartspec-scripts-${Date.now()}.json`;
    } else {
      content = generatedScripts;
      mimeType = 'text/plain';
      filename = `smartspec-scenarios-${Date.now()}.feature`;
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
      description: `SmartSpec scripts exported as ${format === 'feature' ? 'FEATURE' : format.toUpperCase()} file`,
    });
  };

  const createJiraTicket = async () => {
    if (!generatedScripts) {
      toast({
        title: "Error",
        description: "Please generate SmartSpec scripts first.",
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
          scripts: generatedScripts,
          jiraId: jiraData?.id || jiraData?.key || jiraStoryId,
          toolId: "smartspec-script-writer"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast({
        title: "Jira Ticket Created",
        description: `SmartSpec scripts ticket created in Jira: ${result.issueKey || 'Success'}`,
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
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">
                <FileCode className="w-4 h-4 text-white" />
              </div>
              <span>SmartSpec Script Writer</span>
              {jiraData && (
                <Badge variant="secondary">Jira: {jiraData.id}</Badge>
              )}
              {uiElements.length > 0 && (
                <Badge variant="outline">
                  <Layers className="w-3 h-3 mr-1" />
                  {uiElements.length} UI Elements
                </Badge>
              )}
            </div>
            <InfoPopover
              title="SmartSpec BDD Script Writer"
              content="Generate comprehensive BDD Gherkin scenarios for UI testing using the SmartSpec framework with advanced features."
              steps={[
                "Configure UI elements and page objects for better context",
                "Use templates or enter JIRA Story ID / custom requirements",
                "Generate comprehensive BDD Gherkin scenarios",
                "Export as .feature files or create JIRA tickets"
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Generate comprehensive BDD Gherkin test scenarios for UI testing with SmartSpec framework. 
            Configure UI elements, use templates, and create detailed test specifications.
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="elements">UI Elements</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jira-story-id">JIRA Story ID (Optional)</Label>
                  <Input
                    id="jira-story-id"
                    placeholder="Enter JIRA Story ID (e.g., PROJ-123)"
                    value={jiraStoryId}
                    onChange={(e) => setJiraStoryId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>UI Elements Configured</Label>
                  <div className="p-2 border rounded bg-muted">
                    <span className="text-sm">
                      {uiElements.length} elements configured
                      {uiElements.length > 0 && (
                        <span className="text-muted-foreground">
                          {" "}across {new Set(uiElements.map(el => el.page)).size} pages
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-requirements">Custom Requirements</Label>
                <Textarea
                  id="custom-requirements"
                  placeholder="Enter custom test requirements, user stories, or acceptance criteria..."
                  value={customRequirements}
                  onChange={(e) => setCustomRequirements(e.target.value)}
                  rows={4}
                />
              </div>
              
              <Button 
                onClick={handleGenerateScripts}
                disabled={(!jiraStoryId.trim() && !customRequirements.trim()) || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                {isLoading ? "Generating..." : "Generate BDD Scenarios"}
              </Button>

              {generatedScripts && (
                <div className="space-y-2">
                  <Label>Generated SmartSpec BDD Scenarios</Label>
                  <Textarea
                    value={generatedScripts}
                    onChange={(e) => setGeneratedScripts(e.target.value)}
                    className="min-h-96 font-mono text-sm"
                    placeholder="Generated BDD scenarios will appear here..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => exportScripts('feature')} variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Export .feature
                    </Button>
                    <Button onClick={() => exportScripts('json')} variant="outline" className="flex-1">
                      <FileText className="w-4 h-4 mr-2" />
                      Export JSON
                    </Button>
                    <Button 
                      onClick={createJiraTicket}
                      disabled={isCreatingJira}
                      variant="outline" 
                      className="flex-1"
                    >
                      {isCreatingJira ? (
                        <Send className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {isCreatingJira ? "Creating..." : "Create in Jira"}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="elements">
              <SmartSpecEndpointManager 
                elements={uiElements}
                onElementsChange={setUiElements}
              />
            </TabsContent>

            <TabsContent value="templates">
              <SmartSpecTemplateLibrary 
                onTemplateSelect={handleTemplateSelect}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Advanced Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-medium mb-2">SmartSpec Configuration</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Configure backend endpoints and advanced options for SmartSpec script generation.
                    </p>
                    <Button onClick={onConfigOpen} variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Open Configuration
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Generation Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">UI Elements:</span>
                        <span className="ml-2 font-medium">{uiElements.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pages:</span>
                        <span className="ml-2 font-medium">{new Set(uiElements.map(el => el.page)).size}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Generated Lines:</span>
                        <span className="ml-2 font-medium">{generatedScripts.split('\n').length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Scenarios:</span>
                        <span className="ml-2 font-medium">{(generatedScripts.match(/Scenario:/g) || []).length}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

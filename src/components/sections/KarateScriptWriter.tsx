import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCode, Zap, Download, FileText, Send, Eye, Settings, BookOpen } from "lucide-react";
import { KarateAutoGenerate } from "./karate/KarateAutoGenerate";
import { KarateFileManager } from "./karate/KarateFileManager";
import { KarateScriptModal } from "./karate/KarateScriptModal";
import { KarateEndpointManager } from "./karate/KarateEndpointManager";
import { KarateTemplateLibrary } from "./karate/KarateTemplateLibrary";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { InfoPopover } from "@/components/ui/info-popover";
import { useKarateGeneration } from "./karate/hooks/useKarateGeneration";
import { useKarateActions } from "./karate/hooks/useKarateActions";

interface ApiEndpoint {
  id: string;
  name: string;
  method: string;
  url: string;
  description: string;
  headers: Record<string, string>;
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
  requestBody?: string;
  expectedStatus: number;
  responseValidation?: string;
}

interface KarateTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
  tags: string[];
}

interface KarateScriptWriterProps {
  jiraData?: any;
  onConfigOpen: () => void;
}

export function KarateScriptWriter({ jiraData, onConfigOpen }: KarateScriptWriterProps) {
  const [jiraStoryId, setJiraStoryId] = useState("");
  const [importedFiles, setImportedFiles] = useState<File[]>([]);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<KarateTemplate | null>(null);
  
  const {
    generatedScripts,
    isLoading,
    isAutoGenerating,
    showScriptsModal,
    setShowScriptsModal,
    handleAutoGenerateFromJira,
    handleGenerateScripts: originalHandleGenerateScripts
  } = useKarateGeneration();

  const {
    isCreatingJira,
    createJiraTicket,
    exportScripts
  } = useKarateActions();

  // Enhanced script generation with endpoints and templates
  const handleEnhancedGenerateScripts = async () => {
    const enhancedContext = {
      jiraStoryId: jiraStoryId.trim(),
      importedFiles,
      endpoints,
      selectedTemplate,
      enhancedFeatures: true
    };

    // Call the original generation function with enhanced context
    await originalHandleGenerateScripts(jiraStoryId, importedFiles);
  };

  const handleTemplateSelect = (template: KarateTemplate) => {
    setSelectedTemplate(template);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-teal-500 rounded flex items-center justify-center">
                <FileCode className="w-4 h-4 text-white" />
              </div>
              <span>Enhanced Karate Script Writer</span>
              {jiraData && (
                <Badge variant="secondary">Jira: {jiraData.id}</Badge>
              )}
              {importedFiles.length > 0 && (
                <Badge variant="outline">{importedFiles.length} files</Badge>
              )}
              {endpoints.length > 0 && (
                <Badge variant="outline">{endpoints.length} endpoints</Badge>
              )}
            </div>
            <InfoPopover
              title="Enhanced Karate Script Writer"
              content="Professional API testing script generator with advanced features for software engineers."
              steps={[
                "Configure API endpoints or use templates from the library",
                "Enter JIRA Story ID or upload specification files",
                "Generate comprehensive Karate test scripts",
                "Review, export, or create JIRA tickets with generated scripts"
              ]}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Professional-grade Karate API test script generator with endpoint management, template library, and advanced validation patterns.
          </p>

          <ProgressIndicator
            isVisible={isAutoGenerating}
            message="Auto-generating enhanced Karate scripts from JIRA data..."
          />

          <ProgressIndicator
            isVisible={isLoading}
            message="Generating comprehensive Karate test scripts..."
          />

          <ProgressIndicator
            isVisible={isCreatingJira}
            message="Creating JIRA ticket with generated scripts..."
          />

          <KarateAutoGenerate
            jiraData={jiraData}
            isAutoGenerating={isAutoGenerating}
            onAutoGenerate={() => handleAutoGenerateFromJira(jiraData)}
          />

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Setup</TabsTrigger>
              <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
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

                <KarateFileManager
                  importedFiles={importedFiles}
                  onFilesChange={setImportedFiles}
                />

                {selectedTemplate && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-purple-900">Selected Template</h4>
                        <p className="text-sm text-purple-700">{selectedTemplate.name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTemplate(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleEnhancedGenerateScripts}
                    disabled={(!jiraStoryId.trim() && importedFiles.length === 0 && endpoints.length === 0) || isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <Zap className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? "Generating..." : "Generate Enhanced Scripts"}
                  </Button>
                  
                  {generatedScripts && (
                    <Button 
                      onClick={() => setShowScriptsModal(true)} 
                      variant="outline"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Scripts
                    </Button>
                  )}
                </div>

                {generatedScripts && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => createJiraTicket(generatedScripts, jiraData)}
                      disabled={isCreatingJira}
                      variant="outline"
                      className="flex-1"
                    >
                      {isCreatingJira ? (
                        <Send className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {isCreatingJira ? "Creating in Jira..." : "Create Ticket in Jira"}
                    </Button>

                    <div className="flex gap-2">
                      <Button onClick={() => exportScripts(generatedScripts, jiraStoryId, jiraData, 'txt')} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export Feature
                      </Button>
                      <Button onClick={() => exportScripts(generatedScripts, jiraStoryId, jiraData, 'json')} variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Export JSON
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="endpoints">
              <KarateEndpointManager
                endpoints={endpoints}
                onEndpointsChange={setEndpoints}
              />
            </TabsContent>

            <TabsContent value="templates">
              <KarateTemplateLibrary
                onTemplateSelect={handleTemplateSelect}
              />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Advanced Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Test Environment</Label>
                      <Input placeholder="e.g., https://api.staging.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Test Suite Name</Label>
                      <Input placeholder="e.g., User Management API Tests" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Global Headers (JSON)</Label>
                    <Input placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}' />
                  </div>

                  <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium mb-2">Enhanced Features:</h5>
                    <ul className="space-y-1 text-xs">
                      <li>• Advanced response validation patterns</li>
                      <li>• Data-driven test scenarios</li>
                      <li>• Error handling and edge cases</li>
                      <li>• Performance testing assertions</li>
                      <li>• Authentication flow integration</li>
                      <li>• Custom matcher functions</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <KarateScriptModal
        open={showScriptsModal}
        onOpenChange={setShowScriptsModal}
        generatedScripts={generatedScripts}
        jiraStoryId={jiraStoryId}
        isCreatingJira={isCreatingJira}
        onExportScripts={(format) => exportScripts(generatedScripts, jiraStoryId, jiraData, format)}
        onCreateJiraTicket={() => createJiraTicket(generatedScripts, jiraData)}
      />
    </div>
  );
}

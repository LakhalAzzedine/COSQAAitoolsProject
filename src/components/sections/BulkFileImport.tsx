
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, X, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getToolPrompt, buildPromptWithContext, getToolEndpointUrl, defaultEndpointConfig } from "@/config/backendConfig";

interface BulkFileImportProps {
  onFilesProcessed: (files: File[]) => void;
  toolId: string;
  toolName: string;
  jiraData?: any;
  urlData?: any;
}

export function BulkFileImport({ onFilesProcessed, toolId, toolName, jiraData, urlData }: BulkFileImportProps) {
  const [importedFiles, setImportedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImportedFiles(prev => [...prev, ...files]);
    
    toast({
      title: "Files Added",
      description: `${files.length} file(s) added for processing`,
    });
  };

  const removeFile = (index: number) => {
    setImportedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcessFiles = async () => {
    if (importedFiles.length === 0) return;
    
    setIsProcessing(true);
    try {
      // Get saved configuration
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      // Get tool-specific endpoint URL
      const endpointUrl = getToolEndpointUrl(toolId, config);
      
      // Build the context-aware prompt using the new system
      const toolPrompt = getToolPrompt(toolId);
      const contextualPrompt = buildPromptWithContext(
        toolId,
        undefined, // No user input for automatic processing
        jiraData,
        urlData,
        importedFiles.map(f => f.name)
      );

      // Send files to SVC cluster for processing
      const formData = new FormData();
      importedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
      formData.append('toolId', toolId);
      formData.append('toolName', toolName);
      formData.append('prompt', contextualPrompt);
      formData.append('systemPrompt', toolPrompt?.systemPrompt || '');
      
      // Add context data
      if (jiraData) {
        formData.append('jiraData', JSON.stringify(jiraData));
      }
      if (urlData) {
        formData.append('urlData', JSON.stringify(urlData));
      }
      
      console.log(`Processing files with ${toolName} via endpoint: ${endpointUrl}`);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      toast({
        title: `${toolName} Processing Complete`,
        description: data.message || data.result || "Files processed successfully with AI analysis",
        duration: 10000,
      });
      
      onFilesProcessed(importedFiles);
      
    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: "Processing Error",
        description: "Could not process files. Check SVC cluster connection and endpoint configuration.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="h-72 w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <Upload className="w-4 h-4 text-gray-500" />
          <span>Import Files</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Input
            type="file"
            multiple
            accept=".txt,.md,.json,.xml,.feature,.java,.js,.ts,.pdf,.docx,.xlsx"
            onChange={handleFileUpload}
            className="cursor-pointer text-xs"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Supported: .txt, .md, .json, .xml, .feature, .java, .js, .ts, .pdf, .docx, .xlsx
          </p>
        </div>

        {importedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium">Files to Process:</h4>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {importedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-1 bg-muted rounded text-xs">
                  <div className="flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span className="truncate max-w-20">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-4 w-4 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button 
          onClick={handleProcessFiles}
          disabled={importedFiles.length === 0 || isProcessing}
          className="w-full text-xs h-8"
        >
          {isProcessing ? (
            <>Processing...</>
          ) : (
            <>
              <Send className="w-3 h-3 mr-1" />
              Process with {toolName}
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>Files will be processed by your SVC cluster using the {toolName} endpoint.</p>
        </div>
      </CardContent>
    </Card>
  );
}


import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Globe, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { defaultEndpointConfig } from "@/config/backendConfig";

interface UrlIntegrationProps {
  onUrlProcessed: (urlData: any) => void;
}

export function UrlIntegration({ onUrlProcessed }: UrlIntegrationProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<any>(null);
  const { toast } = useToast();

  const handleProcessUrl = async () => {
    if (!url.trim()) return;
    
    setIsLoading(true);
    try {
      // Get saved configuration
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      console.log(`Processing URL: ${url} via ${config.baseUrl}${config.urlProcessingEndpoint}`);
      
      const response = await fetch(`${config.baseUrl}${config.urlProcessingEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const urlData = await response.json();
      
      setProcessedUrl(urlData);
      onUrlProcessed(urlData);
      
      toast({
        title: "URL Processed",
        description: `Successfully processed ${url}`,
      });
      
    } catch (error) {
      console.error('Error processing URL:', error);
      toast({
        title: "Error",
        description: "Could not process URL. Check SVC cluster connection and endpoint configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="w-5 h-5" />
          <span>URL Integration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url-input">Website URL</Label>
          <div className="flex space-x-2">
            <Input
              id="url-input"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
            />
            <Button 
              onClick={handleProcessUrl}
              disabled={!url.trim() || isLoading}
            >
              {isLoading ? <Download className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isLoading ? "Processing..." : "Process"}
            </Button>
          </div>
        </div>

        {processedUrl && (
          <div className="space-y-3 p-3 bg-muted rounded">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{processedUrl.title || "Processed URL"}</h4>
              <Badge>{processedUrl.status || "Active"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground break-all">{processedUrl.url}</p>
            
            {processedUrl.metadata && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Response Time:</span>
                  <p className="text-muted-foreground">{processedUrl.metadata.responseTime || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium">Status Code:</span>
                  <p className="text-muted-foreground">{processedUrl.metadata.statusCode || "N/A"}</p>
                </div>
              </div>
            )}
            
            {processedUrl.analysis && (
              <div className="mt-3">
                <span className="font-medium text-sm">Analysis:</span>
                <p className="text-sm text-muted-foreground mt-1">{processedUrl.analysis}</p>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>URL will be analyzed by your SVC cluster using the configured endpoint.</p>
        </div>
      </CardContent>
    </Card>
  );
}

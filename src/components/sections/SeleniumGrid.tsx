
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, ExternalLink } from "lucide-react";

interface SeleniumGridProps {
  gridType: "qa" | "prod";
}

export function SeleniumGrid({ gridType }: SeleniumGridProps) {
  const getGridConfig = () => {
    switch (gridType) {
      case "qa":
        return {
          title: "Selenium QA Grid",
          description: "QA Environment Selenium Grid Console",
          url: "", // Add your QA Selenium Grid URL here
          badge: "QA",
          badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
        };
      case "prod":
        return {
          title: "Selenium PROD Grid",
          description: "Production Environment Selenium Grid Console",
          url: "", // Add your PROD Selenium Grid URL here
          badge: "PROD",
          badgeColor: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
        };
    }
  };

  const config = getGridConfig();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Grid3X3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
            <p className="text-muted-foreground">{config.description}</p>
          </div>
        </div>
        <Badge className={config.badgeColor}>
          {config.badge}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Grid Console</span>
            {config.url && (
              <a 
                href={config.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 flex items-center space-x-1"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">Open in New Tab</span>
              </a>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {config.url ? (
            <div className="w-full h-[600px] border rounded-lg overflow-hidden">
              <iframe
                src={config.url}
                className="w-full h-full"
                title={`${config.title} Console`}
                frameBorder="0"
              />
            </div>
          ) : (
            <div className="w-full h-[600px] border rounded-lg bg-muted/10 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Grid3X3 className="w-16 h-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-foreground">Grid URL Not Configured</h3>
                  <p className="text-muted-foreground">
                    Please add the {config.title} URL to display the console here.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {config.url && (
        <Card>
          <CardHeader>
            <CardTitle>Grid Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Environment</p>
                <p className="text-lg font-semibold">{config.badge}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Console URL</p>
                <p className="text-sm text-primary break-all">{config.url}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Online</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

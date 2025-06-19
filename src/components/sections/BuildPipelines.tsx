
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Rocket, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { defaultEndpointConfig } from "@/config/backendConfig";

interface BuildData {
  id: string;
  app: string;
  type: string;
  status: string;
  time: string;
  duration: string;
}

interface PipelineStats {
  successfulBuilds: number;
  failedBuilds: number;
  avgBuildTime: string;
  successRate: string;
}

export function BuildPipelines() {
  const [selectedApp, setSelectedApp] = useState("tsdm");
  const [isBuilding, setIsBuilding] = useState({ qa: false, prod: false });
  const [recentBuilds, setRecentBuilds] = useState<BuildData[]>([]);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchBuildData = async () => {
    setIsLoading(true);
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const response = await fetch(`${config.baseUrl}/build-pipelines`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRecentBuilds(data.recentBuilds || []);
      setPipelineStats(data.stats || null);

      toast({
        title: "Build Data Updated",
        description: "Pipeline data refreshed successfully",
      });

    } catch (error) {
      console.error('Error fetching build data:', error);
      toast({
        title: "Error",
        description: "Could not fetch build pipeline data. Check SVC cluster connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildData();
  }, []);

  const handleBuildTrigger = async (type: "qa" | "prod") => {
    setIsBuilding(prev => ({ ...prev, [type]: true }));
    console.log(`Triggering ${type.toUpperCase()} build for ${selectedApp.toUpperCase()}`);
    
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const response = await fetch(`${config.baseUrl}/trigger-build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          app: selectedApp, 
          env: type 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Build Triggered",
        description: `${type.toUpperCase()} build initiated for ${selectedApp.toUpperCase()}`,
      });

      // Refresh build data after triggering
      setTimeout(() => {
        fetchBuildData();
      }, 2000);

    } catch (error) {
      console.error('Error triggering build:', error);
      toast({
        title: "Error",
        description: "Could not trigger build. Check SVC cluster connection.",
        variant: "destructive",
      });
    } finally {
      setIsBuilding(prev => ({ ...prev, [type]: false }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">QA Build Pipelines</h1>
          <p className="text-muted-foreground">Trigger and monitor build deployments</p>
        </div>
        <Button onClick={fetchBuildData} disabled={isLoading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Rocket className="w-5 h-5" />
              <span>Build Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select Application
              </label>
              <Select value={selectedApp} onValueChange={setSelectedApp}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tsdm">TSDM</SelectItem>
                  <SelectItem value="navigator">Navigator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => handleBuildTrigger("qa")}
                disabled={isBuilding.qa}
                className="h-12 flex items-center justify-center space-x-2"
              >
                {isBuilding.qa ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>{isBuilding.qa ? "Building..." : "Trigger QA Build"}</span>
              </Button>

              <Button
                onClick={() => handleBuildTrigger("prod")}
                disabled={isBuilding.prod}
                variant="destructive"
                className="h-12 flex items-center justify-center space-x-2"
              >
                {isBuilding.prod ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4" />
                )}
                <span>{isBuilding.prod ? "Deploying..." : "Trigger PROD Build"}</span>
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <div>Selected: <span className="font-medium">{selectedApp.toUpperCase()}</span> application</div>
              <div>Connected to SVC cluster for real-time pipeline data</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Builds</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                <span>Loading builds...</span>
              </div>
            )}
            
            {!isLoading && recentBuilds.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <Rocket className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Build Data</h3>
                <p className="text-muted-foreground text-center">
                  No recent builds found. Check SVC cluster connection.
                </p>
              </div>
            )}

            {!isLoading && recentBuilds.length > 0 && (
              <div className="space-y-3">
                {recentBuilds.map((build) => (
                  <div key={build.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(build.status)}
                      <div>
                        <div className="font-medium text-sm">
                          {build.app} - {build.type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {build.time} • {build.duration}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(build.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {pipelineStats && (
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{pipelineStats.successfulBuilds}</div>
                <div className="text-sm text-muted-foreground">Successful Builds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{pipelineStats.failedBuilds}</div>
                <div className="text-sm text-muted-foreground">Failed Builds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{pipelineStats.avgBuildTime}</div>
                <div className="text-sm text-muted-foreground">Avg Build Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{pipelineStats.successRate}</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !pipelineStats && recentBuilds.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Rocket className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pipeline Data Available</h3>
            <p className="text-muted-foreground text-center">
              Unable to fetch pipeline data from the SVC cluster. Please check your connection and try refreshing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

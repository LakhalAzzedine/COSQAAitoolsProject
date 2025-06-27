
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Rocket, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Brain,
  Zap,
  TrendingUp,
  AlertTriangle,
  Shield,
  Target,
  GitBranch,
  Settings,
  BarChart3,
  Activity,
  Users,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { defaultEndpointConfig } from "@/config/backendConfig";

interface BuildData {
  id: string;
  app: string;
  type: string;
  status: string;
  time: string;
  duration: string;
  branch?: string;
  commit?: string;
  author?: string;
  tests?: {
    passed: number;
    failed: number;
    coverage: number;
  };
}

interface PipelineStats {
  successfulBuilds: number;
  failedBuilds: number;
  avgBuildTime: string;
  successRate: string;
  deploymentFrequency: string;
  leadTime: string;
  mttr: string;
  changeFailureRate: string;
}

interface AIInsights {
  riskScore: number;
  recommendations: string[];
  predictedDuration: string;
  qualityScore: number;
  optimizationSuggestions: string[];
}

export function BuildPipelines() {
  const [selectedApp, setSelectedApp] = useState("tsdm");
  const [selectedEnvironment, setSelectedEnvironment] = useState("qa");
  const [isBuilding, setIsBuilding] = useState({ qa: false, staging: false, prod: false });
  const [recentBuilds, setRecentBuilds] = useState<BuildData[]>([]);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBuildData = async () => {
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      console.log("Fetching pipeline data from:", `${config.baseUrl}/build-pipelines`);

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
      
      // Only set data if it exists in the response
      if (data.recentBuilds) {
        setRecentBuilds(data.recentBuilds);
      }
      if (data.stats) {
        setPipelineStats(data.stats);
      }
      if (data.aiInsights) {
        setAiInsights(data.aiInsights);
      }

      toast({
        title: "✅ Pipeline Data Loaded",
        description: "Connected to external pipeline feed successfully",
      });

    } catch (error) {
      console.error('Error fetching build data:', error);
      setConnectionError("Unable to connect to external pipeline feed. Please check your endpoint configuration.");
      
      // Clear existing data when connection fails
      setRecentBuilds([]);
      setPipelineStats(null);
      setAiInsights(null);
      
      toast({
        title: "❌ Connection Failed",
        description: "Cannot connect to pipeline feed. Configure endpoint in settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildData();
    const interval = setInterval(fetchBuildData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleBuildTrigger = async (type: "qa" | "staging" | "prod") => {
    setIsBuilding(prev => ({ ...prev, [type]: true }));
    console.log(`🚀 Triggering ${type.toUpperCase()} build for ${selectedApp.toUpperCase()}`);
    
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
          env: type,
          aiOptimized: true,
          features: ['parallelization', 'smart-caching', 'predictive-testing']
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "🚀 Build Triggered",
        description: `${type.toUpperCase()} deployment initiated for ${selectedApp.toUpperCase()}`,
      });

      setTimeout(() => {
        fetchBuildData();
      }, 2000);

    } catch (error) {
      console.error('Error triggering build:', error);
      toast({
        title: "❌ Build Trigger Failed",
        description: "Could not initiate build. Check endpoint configuration.",
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

  const getRiskColor = (score: number) => {
    if (score <= 20) return "text-green-600";
    if (score <= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🚀 QA Build Pipelines
          </h1>
          <p className="text-muted-foreground mt-1">Professional CI/CD pipeline management with real-time analytics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchBuildData} disabled={isLoading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {connectionError && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <div className="font-medium text-red-800 dark:text-red-300">Connection Error</div>
                <div className="text-sm text-red-700 dark:text-red-400">{connectionError}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="builds">Build Control</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* DORA Metrics */}
          {pipelineStats ? (
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span>DORA Metrics Dashboard</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="text-2xl font-bold text-green-600 mb-1">{pipelineStats.deploymentFrequency}</div>
                    <div className="text-sm text-muted-foreground">Deployment Frequency</div>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{pipelineStats.leadTime}</div>
                    <div className="text-sm text-muted-foreground">Lead Time</div>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{pipelineStats.mttr}</div>
                    <div className="text-sm text-muted-foreground">MTTR</div>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{pipelineStats.changeFailureRate}</div>
                    <div className="text-sm text-muted-foreground">Change Failure Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-gray-200">
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-lg font-medium text-gray-600 mb-2">No DORA Metrics Available</div>
                <div className="text-sm text-gray-500">Connect to your pipeline feed to view metrics</div>
              </CardContent>
            </Card>
          )}

          {/* Recent Builds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Recent Pipeline Executions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading pipeline data...</span>
                </div>
              )}
              
              {!isLoading && recentBuilds.length > 0 && (
                <div className="space-y-4">
                  {recentBuilds.map((build) => (
                    <div key={build.id} className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(build.status)}
                          <div>
                            <div className="font-semibold flex items-center space-x-2">
                              <span>{build.app.toUpperCase()} - {build.type}</span>
                              {build.branch && (
                                <>
                                  <GitBranch className="w-3 h-3" />
                                  <span className="text-sm text-muted-foreground">{build.branch}</span>
                                </>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center space-x-4">
                              <span>{build.time} • {build.duration}</span>
                              {build.author && <span>by {build.author}</span>}
                              {build.commit && <span>#{build.commit}</span>}
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(build.status)}
                      </div>
                      
                      {build.tests && (
                        <div className="grid grid-cols-3 gap-4 mt-3 p-3 bg-muted/30 rounded">
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{build.tests.passed}</div>
                            <div className="text-xs text-muted-foreground">Tests Passed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">{build.tests.failed}</div>
                            <div className="text-xs text-muted-foreground">Tests Failed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{build.tests.coverage}%</div>
                            <div className="text-xs text-muted-foreground">Coverage</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && recentBuilds.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-lg font-medium text-gray-600 mb-2">No Recent Builds</div>
                  <div className="text-sm text-gray-500">Connect to your pipeline feed to view build history</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builds" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Rocket className="w-5 h-5 text-purple-600" />
                  <span>Build Control</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Application</label>
                    <Select value={selectedApp} onValueChange={setSelectedApp}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tsdm">TSDM</SelectItem>
                        <SelectItem value="navigator">Navigator</SelectItem>
                        <SelectItem value="api-gateway">API Gateway</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Environment</label>
                    <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="qa">QA</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="prod">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={() => handleBuildTrigger("qa")}
                    disabled={isBuilding.qa}
                    className="h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {isBuilding.qa ? (
                      <Clock className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    <span>{isBuilding.qa ? "Building..." : "Deploy to QA"}</span>
                  </Button>

                  <Button
                    onClick={() => handleBuildTrigger("staging")}
                    disabled={isBuilding.staging}
                    variant="outline"
                    className="h-12 border-2 border-blue-300 hover:bg-blue-50"
                  >
                    {isBuilding.staging ? (
                      <Clock className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Target className="w-4 h-4 mr-2" />
                    )}
                    <span>{isBuilding.staging ? "Staging..." : "Deploy to Staging"}</span>
                  </Button>

                  <Button
                    onClick={() => handleBuildTrigger("prod")}
                    disabled={isBuilding.prod}
                    variant="destructive"
                    className="h-12 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                  >
                    {isBuilding.prod ? (
                      <Clock className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Rocket className="w-4 h-4 mr-2" />
                    )}
                    <span>{isBuilding.prod ? "Deploying..." : "Deploy to Production"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Prediction Card */}
            {aiInsights ? (
              <Card className="border-2 border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-cyan-600" />
                    <span>AI Build Prediction</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className="text-xl font-bold text-blue-600">{aiInsights.predictedDuration}</div>
                      <div className="text-xs text-muted-foreground">Predicted Duration</div>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <div className={`text-xl font-bold ${getRiskColor(aiInsights.riskScore)}`}>
                        {aiInsights.riskScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Risk Score</div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white/70 dark:bg-gray-800/70 rounded border">
                    <div className="text-sm font-medium mb-2 flex items-center">
                      <Zap className="w-4 h-4 mr-1 text-yellow-500" />
                      Recommendations
                    </div>
                    <div className="space-y-1 text-xs">
                      {aiInsights.recommendations.slice(0, 2).map((rec, index) => (
                        <div key={index} className="flex items-start space-x-1">
                          <span className="text-blue-500">•</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-8 text-center">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-lg font-medium text-gray-600 mb-2">No AI Insights Available</div>
                  <div className="text-sm text-gray-500">Connect to pipeline feed for AI predictions</div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {pipelineStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">{pipelineStats.successfulBuilds}</div>
                  <div className="text-sm text-muted-foreground">Successful Builds</div>
                  <Progress value={97} className="mt-2 h-1" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">{pipelineStats.failedBuilds}</div>
                  <div className="text-sm text-muted-foreground">Failed Builds</div>
                  <Progress value={3} className="mt-2 h-1" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{pipelineStats.avgBuildTime}</div>
                  <div className="text-sm text-muted-foreground">Avg Build Time</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{pipelineStats.successRate}</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-lg font-medium text-gray-600 mb-2">No Analytics Data</div>
                <div className="text-sm text-gray-500">Connect to your pipeline feed to view detailed analytics</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {aiInsights ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-emerald-600" />
                    <span>AI Quality Assessment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
                    <div className="text-3xl font-bold text-emerald-600 mb-2">{aiInsights.qualityScore}/100</div>
                    <div className="text-sm text-muted-foreground mb-2">Overall Quality Score</div>
                    <Progress value={aiInsights.qualityScore} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1 text-blue-500" />
                      AI Recommendations
                    </div>
                    {aiInsights.recommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-white/70 dark:bg-gray-800/70 rounded border text-sm">
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                    <span>Optimization Opportunities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {aiInsights.optimizationSuggestions.map((suggestion, index) => (
                      <div key={index} className="p-3 bg-white/70 dark:bg-gray-800/70 rounded border">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium">{suggestion}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-lg font-medium text-gray-600 mb-2">No AI Insights Available</div>
                <div className="text-sm text-gray-500">Connect to your pipeline feed to get AI-powered insights and recommendations</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

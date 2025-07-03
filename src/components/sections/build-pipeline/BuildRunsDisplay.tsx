
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  GitBranch, 
  User, 
  BarChart3,
  Brain,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useBuildPipeline } from '@/hooks/useBuildPipeline';

export function BuildRunsDisplay() {
  const { buildRuns, fetchBuildRuns, isLoading, saveBuildAnalysis } = useBuildPipeline();

  useEffect(() => {
    fetchBuildRuns();
    const interval = setInterval(fetchBuildRuns, 30000);
    return () => clearInterval(interval);
  }, [fetchBuildRuns]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const handleSaveAnalysis = async (buildId: string) => {
    const mockAnalysis = {
      performance: Math.floor(Math.random() * 30) + 70,
      quality: Math.floor(Math.random() * 20) + 80,
      security: Math.floor(Math.random() * 15) + 85,
      recommendations: [
        "Consider implementing parallel test execution",
        "Optimize Docker layer caching",
        "Add performance monitoring hooks"
      ]
    };
    
    await saveBuildAnalysis(buildId, mockAnalysis);
  };

  return (
    <Card className="ai-card-hover">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Build Runs & Analysis</span>
          </div>
          <Button
            onClick={fetchBuildRuns}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {buildRuns.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-600 mb-2">No Build Runs Yet</div>
            <div className="text-sm text-gray-500">Trigger your first build to see results here</div>
          </div>
        ) : (
          <div className="space-y-4">
            {buildRuns.map((run) => (
              <div
                key={run.id}
                className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors ai-gradient-accent"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(run.status)}
                    <div>
                      <div className="font-semibold flex items-center space-x-2">
                        <span>{run.app.toUpperCase()} - {run.env.toUpperCase()}</span>
                        {run.branch && (
                          <>
                            <GitBranch className="w-3 h-3" />
                            <span className="text-sm text-muted-foreground">{run.branch}</span>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center space-x-4">
                        <span>{run.startTime}</span>
                        {run.duration && <span>• {run.duration}</span>}
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{run.triggeredBy}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(run.status)}
                </div>

                {run.analysis ? (
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
                    <div className="flex items-center space-x-2 mb-3">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-sm">AI Analysis Results</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{run.analysis.performance}%</div>
                        <div className="text-xs text-muted-foreground">Performance</div>
                        <Progress value={run.analysis.performance} className="h-1 mt-1" />
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{run.analysis.quality}%</div>
                        <div className="text-xs text-muted-foreground">Quality</div>
                        <Progress value={run.analysis.quality} className="h-1 mt-1" />
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{run.analysis.security}%</div>
                        <div className="text-xs text-muted-foreground">Security</div>
                        <Progress value={run.analysis.security} className="h-1 mt-1" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-medium flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Recommendations</span>
                      </div>
                      {run.analysis.recommendations.slice(0, 2).map((rec, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          • {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : run.status === 'success' && (
                  <div className="mt-3">
                    <Button
                      onClick={() => handleSaveAnalysis(run.id)}
                      size="sm"
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <BarChart3 className="w-3 h-3" />
                      <span>Generate AI Analysis</span>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Play, 
  Target,
  Zap,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getBuildPipelineConfig } from "@/config/buildPipelineConfig";
import { AIProgressSpinner } from "@/components/ui/ai-progress-spinner";

export function BuildPipelines() {
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [selectedEnv, setSelectedEnv] = useState<string>('');
  const [isTriggering, setIsTriggering] = useState(false);
  const { toast } = useToast();

  const apps = [
    { value: 'navigator', label: 'Navigator', icon: '🧭' },
    { value: 'tsdm', label: 'TSDM', icon: '🎯' },
  ];

  const environments = [
    { value: 'qa', label: 'QA', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' },
    { value: 'prod', label: 'PROD', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' },
  ];

  const triggerPipeline = async () => {
    if (!selectedApp || !selectedEnv) {
      toast({
        title: "❌ Selection Required",
        description: "Please select both an application and environment",
        variant: "destructive",
      });
      return;
    }

    setIsTriggering(true);
    
    try {
      const config = getBuildPipelineConfig();
      const url = `${config.buildBaseUrl}/trigger-build/${selectedApp}/${selectedEnv}`;
      
      console.log(`🚀 Triggering ${selectedEnv.toUpperCase()} pipeline for ${selectedApp.toUpperCase()}`);
      console.log(`Calling: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          triggeredBy: 'qa-dashboard',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      toast({
        title: "🚀 Pipeline Triggered Successfully",
        description: `${selectedEnv.toUpperCase()} deployment initiated for ${selectedApp.toUpperCase()}`,
      });

      console.log('Pipeline triggered successfully:', result);
      
    } catch (error) {
      console.error('Error triggering pipeline:', error);
      toast({
        title: "❌ Pipeline Trigger Failed",
        description: "Could not initiate pipeline. Check your configuration and try again.",
        variant: "destructive",
      });
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🚀 QA Pipeline Trigger
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Simple interface to trigger PVT pipelines for Navigator and TSDM
          </p>
        </div>
      </div>

      {/* AI Progress Spinner for Loading */}
      <AIProgressSpinner 
        isVisible={isTriggering} 
        messages={[
          "Connecting to pipeline...",
          "Triggering deployment...",
          "Initializing build process...",
          "Starting pipeline execution...",
          "Pipeline triggered successfully!",
        ]}
      />

      {!isTriggering && (
        <Card className="border-2 border-gray-200 bg-white max-w-2xl mx-auto dark:border-orange-500/50 dark:bg-gray-900 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white dark:from-orange-500 dark:to-orange-600">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <span className="text-gray-900 dark:text-white font-semibold">
                  Pipeline Control Center
                </span>
                <div className="text-sm text-gray-600 dark:text-gray-300 font-normal">
                  Select application and environment to trigger
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Application Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                <Target className="w-4 h-4" />
                <span>Application</span>
              </label>
              <Select value={selectedApp} onValueChange={setSelectedApp}>
                <SelectTrigger className="h-12 border-gray-300 dark:border-orange-500/30 dark:bg-gray-800 dark:text-white">
                  <SelectValue placeholder="Select an application" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-orange-500/30">
                  {apps.map((app) => (
                    <SelectItem key={app.value} value={app.value} className="dark:text-white dark:hover:bg-orange-900/20">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{app.icon}</span>
                        <span className="font-medium">{app.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Environment Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                <Zap className="w-4 h-4" />
                <span>Environment</span>
              </label>
              <Select value={selectedEnv} onValueChange={setSelectedEnv}>
                <SelectTrigger className="h-12 border-gray-300 dark:border-orange-500/30 dark:bg-gray-800 dark:text-white">
                  <SelectValue placeholder="Select an environment" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-orange-500/30">
                  {environments.map((env) => (
                    <SelectItem key={env.value} value={env.value} className="dark:text-white dark:hover:bg-orange-900/20">
                      <Badge className={env.color}>
                        {env.label}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Selection Display */}
            {selectedApp && selectedEnv && (
              <div className="p-4 bg-blue-50 dark:bg-orange-900/20 rounded-lg border border-blue-200 dark:border-orange-600/50">
                <div className="text-sm font-medium text-blue-800 dark:text-orange-200 mb-2">
                  Ready to trigger:
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {apps.find(app => app.value === selectedApp)?.icon}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {apps.find(app => app.value === selectedApp)?.label}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">→</span>
                  <Badge className={environments.find(env => env.value === selectedEnv)?.color}>
                    {environments.find(env => env.value === selectedEnv)?.label}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Endpoint: /trigger-build/{selectedApp}/{selectedEnv}
                </div>
              </div>
            )}

            {/* Trigger Button */}
            <Button
              onClick={triggerPipeline}
              disabled={!selectedApp || !selectedEnv || isTriggering}
              className="w-full h-14 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-semibold dark:from-orange-500 dark:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 disabled:opacity-50"
            >
              <Play className="w-5 h-5 mr-3" />
              {isTriggering ? 'Triggering Pipeline...' : 'Trigger Pipeline'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AIProgressSpinner } from '@/components/ui/ai-progress-spinner';
import { 
  Rocket, 
  Play, 
  Target, 
  Brain, 
  Zap, 
  Settings,
  GitBranch,
  Sparkles 
} from 'lucide-react';
import { useBuildPipeline, BuildTriggerRequest } from '@/hooks/useBuildPipeline';

export function BuildControlPanel() {
  const [selectedApp, setSelectedApp] = useState('tsdm');
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['ai-optimization']);
  const { triggerBuild, activeBuilds } = useBuildPipeline();

  const handleBuildTrigger = async (env: 'qa' | 'staging' | 'prod') => {
    const request: BuildTriggerRequest = {
      app: selectedApp,
      env,
      branch: selectedBranch,
      features: selectedFeatures,
      aiOptimized: true,
    };

    await triggerBuild(request);
  };

  const apps = [
    { value: 'tsdm', label: 'TSDM', icon: '🎯' },
    { value: 'navigator', label: 'Navigator', icon: '🧭' },
    { value: 'api-gateway', label: 'API Gateway', icon: '🌐' },
  ];

  const branches = [
    { value: 'main', label: 'main' },
    { value: 'develop', label: 'develop' },
    { value: 'feature/ai-enhancement', label: 'feature/ai-enhancement' },
  ];

  const features = [
    { value: 'ai-optimization', label: 'AI Optimization', icon: <Brain className="w-3 h-3" /> },
    { value: 'smart-caching', label: 'Smart Caching', icon: <Zap className="w-3 h-3" /> },
    { value: 'parallel-testing', label: 'Parallel Testing', icon: <Target className="w-3 h-3" /> },
  ];

  return (
    <Card className="ai-card-hover border-2 border-purple-200/50 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI-Powered Build Control
            </span>
            <div className="text-sm text-muted-foreground font-normal">
              Intelligent pipeline orchestration
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Application</span>
            </label>
            <Select value={selectedApp} onValueChange={setSelectedApp}>
              <SelectTrigger className="ai-border-gradient">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {apps.map((app) => (
                  <SelectItem key={app.value} value={app.value}>
                    <div className="flex items-center space-x-2">
                      <span>{app.icon}</span>
                      <span>{app.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <GitBranch className="w-4 h-4" />
              <span>Branch</span>
            </label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="ai-border-gradient">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.value} value={branch.value}>
                    {branch.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* AI Features */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>AI Features</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <Badge
                key={feature.value}
                variant={selectedFeatures.includes(feature.value) ? "default" : "outline"}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  setSelectedFeatures(prev =>
                    prev.includes(feature.value)
                      ? prev.filter(f => f !== feature.value)
                      : [...prev, feature.value]
                  );
                }}
              >
                {feature.icon}
                <span className="ml-1">{feature.label}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Deployment Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={() => handleBuildTrigger('qa')}
            disabled={activeBuilds.qa}
            className="h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {activeBuilds.qa ? (
              <>
                <AIProgressSpinner isVisible={true} className="w-4 h-4 mr-2" />
                <span>Deploying...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                <span>Deploy to QA</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => handleBuildTrigger('staging')}
            disabled={activeBuilds.staging}
            variant="outline"
            className="h-12 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300"
          >
            {activeBuilds.staging ? (
              <>
                <AIProgressSpinner isVisible={true} className="w-4 h-4 mr-2" />
                <span>Staging...</span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                <span>Deploy to Staging</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => handleBuildTrigger('prod')}
            disabled={activeBuilds.prod}
            variant="destructive"
            className="h-12 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {activeBuilds.prod ? (
              <>
                <AIProgressSpinner isVisible={true} className="w-4 h-4 mr-2" />
                <span>Deploying...</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                <span>Deploy to Production</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

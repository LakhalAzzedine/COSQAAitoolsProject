
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getBuildPipelineConfig } from '@/config/buildPipelineConfig';

export interface BuildTriggerRequest {
  app: string;
  env: 'qa' | 'staging' | 'prod';
  branch?: string;
  features?: string[];
  aiOptimized?: boolean;
}

export interface BuildRun {
  id: string;
  app: string;
  env: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startTime: string;
  endTime?: string;
  duration?: string;
  triggeredBy: string;
  branch?: string;
  commit?: string;
  logs?: string[];
  analysis?: {
    performance: number;
    quality: number;
    security: number;
    recommendations: string[];
  };
}

export function useBuildPipeline() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeBuilds, setActiveBuilds] = useState<Record<string, boolean>>({});
  const [buildRuns, setBuildRuns] = useState<BuildRun[]>([]);
  const { toast } = useToast();

  const triggerBuild = useCallback(async (request: BuildTriggerRequest): Promise<BuildRun | null> => {
    const config = getBuildPipelineConfig();
    setIsLoading(true);
    setActiveBuilds(prev => ({ ...prev, [request.env]: true }));

    try {
      console.log(`🚀 Triggering ${request.env.toUpperCase()} build for ${request.app.toUpperCase()}`);
      
      const response = await fetch(`${config.buildBaseUrl}/api/${config.apiVersion}/builds/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          timestamp: new Date().toISOString(),
          triggeredBy: 'qa-dashboard',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const buildRun: BuildRun = await response.json();
      
      setBuildRuns(prev => [buildRun, ...prev]);
      
      toast({
        title: "🚀 Build Triggered Successfully",
        description: `${request.env.toUpperCase()} deployment initiated for ${request.app.toUpperCase()}`,
      });

      return buildRun;
    } catch (error) {
      console.error('Error triggering build:', error);
      toast({
        title: "❌ Build Trigger Failed",
        description: "Could not initiate build. Check your configuration.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
      setActiveBuilds(prev => ({ ...prev, [request.env]: false }));
    }
  }, [toast]);

  const fetchBuildRuns = useCallback(async (): Promise<void> => {
    const config = getBuildPipelineConfig();
    setIsLoading(true);

    try {
      const response = await fetch(`${config.buildBaseUrl}/api/${config.apiVersion}/builds`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const runs: BuildRun[] = await response.json();
      setBuildRuns(runs);
    } catch (error) {
      console.error('Error fetching build runs:', error);
      toast({
        title: "❌ Failed to Load Build History",
        description: "Could not fetch build runs. Check your configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const saveBuildAnalysis = useCallback(async (buildId: string, analysis: BuildRun['analysis']): Promise<void> => {
    const config = getBuildPipelineConfig();

    try {
      const response = await fetch(`${config.buildBaseUrl}/api/${config.apiVersion}/builds/${buildId}/analysis`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysis),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setBuildRuns(prev => 
        prev.map(run => 
          run.id === buildId 
            ? { ...run, analysis }
            : run
        )
      );

      toast({
        title: "✅ Analysis Saved",
        description: "Build analysis has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving analysis:', error);
      toast({
        title: "❌ Failed to Save Analysis",
        description: "Could not save build analysis.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    triggerBuild,
    fetchBuildRuns,
    saveBuildAnalysis,
    isLoading,
    activeBuilds,
    buildRuns,
  };
}


export interface BuildPipelineConfig {
  buildBaseUrl: string;
  apiVersion: string;
  timeout: number;
  retryAttempts: number;
}

export const defaultBuildPipelineConfig: BuildPipelineConfig = {
  buildBaseUrl: "http://localhost:3002",
  apiVersion: "v1",
  timeout: 30000,
  retryAttempts: 3,
};

export const getBuildPipelineConfig = (): BuildPipelineConfig => {
  const savedConfig = localStorage.getItem("buildPipelineConfig");
  
  if (savedConfig) {
    try {
      const parsedConfig = JSON.parse(savedConfig);
      return { ...defaultBuildPipelineConfig, ...parsedConfig };
    } catch (error) {
      console.warn("Invalid build pipeline config in localStorage, using defaults");
      return defaultBuildPipelineConfig;
    }
  }
  
  return defaultBuildPipelineConfig;
};

export const setBuildPipelineConfig = (config: Partial<BuildPipelineConfig>): void => {
  const currentConfig = getBuildPipelineConfig();
  const newConfig = { ...currentConfig, ...config };
  localStorage.setItem("buildPipelineConfig", JSON.stringify(newConfig));
};

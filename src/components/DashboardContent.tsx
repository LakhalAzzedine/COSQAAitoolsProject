
import { EndpointsMonitor } from "./sections/EndpointsMonitor";
import { QATools } from "./sections/QATools";
import { BuildPipelines } from "./sections/BuildPipelines";
import { SeleniumGrid } from "./sections/SeleniumGrid";

interface DashboardContentProps {
  activeSection: string;
  selectedTool?: any;
  onToolSelect?: (tool: any) => void;
}

export function DashboardContent({ activeSection, selectedTool, onToolSelect }: DashboardContentProps) {
  const renderContent = () => {
    switch (activeSection) {
      case "endpoints":
        return <EndpointsMonitor />;
      case "qa-tools":
        return (
          <QATools 
            selectedTool={selectedTool}
            onToolSelect={onToolSelect}
          />
        );
      case "pipelines":
        return <BuildPipelines />;
      case "selenium-qa":
        return <SeleniumGrid gridType="qa" />;
      case "selenium-prod":
        return <SeleniumGrid gridType="prod" />;
      default:
        return <EndpointsMonitor />;
    }
  };

  return (
    <div className="p-6">
      {renderContent()}
    </div>
  );
}

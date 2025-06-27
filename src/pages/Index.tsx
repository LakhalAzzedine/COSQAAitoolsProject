
import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { DashboardContent } from "../components/DashboardContent";

const Index = () => {
  const [activeSection, setActiveSection] = useState("endpoints");
  const [isCollapsed, setIsCollapsed] = useState(true); // Always start collapsed
  const [selectedTool, setSelectedTool] = useState(null);

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isCollapsed={true} // Force always collapsed
        setIsCollapsed={() => {}} // Disable toggle functionality
      />
      <div className="flex-1 flex flex-col">
        <TopBar 
          activeSection={activeSection}
          selectedTool={selectedTool}
          onToolSelect={setSelectedTool}
        />
        <main className="flex-1 overflow-auto">
          <DashboardContent 
            activeSection={activeSection} 
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
          />
        </main>
      </div>
    </div>
  );
};

export default Index;
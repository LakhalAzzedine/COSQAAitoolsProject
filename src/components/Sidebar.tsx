
import { Activity, Brain, Hammer, BookOpen, HelpCircle, Wifi, WifiOff, Grid3X3, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamInfoPopup } from "./TeamInfoPopup";

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const menuItems = [
  {
    id: "endpoints",
    label: "Endpoints Monitor",
    icon: Activity,
    badge: "Live"
  },
  {
    id: "qa-tools",
    label: "QA AI Tools",
    icon: Brain,
    badge: null
  },
  {
    id: "team-analytics",
    label: "Team Analytics",
    icon: BarChart3,
    badge: "JQL"
  },
  {
    id: "pipelines",
    label: "QA Build Pipelines",
    icon: Hammer,
    badge: null
  },
  {
    id: "selenium-qa",
    label: "Selenium QA",
    icon: Grid3X3,
    badge: null
  },
  {
    id: "selenium-prod",
    label: "Selenium PROD",
    icon: Grid3X3,
    badge: null
  },
  {
    id: "confluence",
    label: "Confluence",
    icon: BookOpen,
    badge: null,
    external: true
  }
];

export function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const handleItemClick = (item: any) => {
    if (item.external && item.id === "confluence") {
      window.open("https://confluence.atlassian.com", "_blank");
      return;
    }
    setActiveSection(item.id);
  };

  return (
    <div className="bg-card border-r border-border flex flex-col h-screen w-16">
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                "w-full flex items-center justify-center px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={item.label}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border space-y-2">
        <TeamInfoPopup />
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="System Status: Online"></div>
        </div>
      </div>
    </div>
  );
}


import { Activity, Brain, Hammer, BookOpen, HelpCircle, Wifi, WifiOff, Grid3X3, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

export function Sidebar({ activeSection, setActiveSection, isCollapsed, setIsCollapsed }: SidebarProps) {
  const handleItemClick = (item: any) => {
    if (item.external && item.id === "confluence") {
      window.open("https://confluence.atlassian.com", "_blank");
      return;
    }
    setActiveSection(item.id);
  };

  return (
    <div className={cn(
      "bg-card border-r border-border flex flex-col h-screen transition-all duration-300 ease-in-out relative",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <div className={cn(
                "flex items-center",
                isCollapsed ? "justify-center" : "space-x-3"
              )}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </div>
              {!isCollapsed && item.badge && (
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  item.badge === "Live" 
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-secondary text-secondary-foreground"
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      
      {!isCollapsed && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>System Status: Online</span>
          </div>
        </div>
      )}
    </div>
  );
}

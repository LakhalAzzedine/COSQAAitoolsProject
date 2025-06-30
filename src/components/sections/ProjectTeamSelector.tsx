import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FolderOpen, 
  Users, 
  CheckCircle, 
  Bug, 
  AlertTriangle, 
  UserCheck,
  ChevronDown,
  ChevronRight,
  CheckSquare
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DailyTeamData, FilterOptions } from "@/types/jiraDashboard";

interface ProjectTeamSelectorProps {
  teamData: DailyTeamData[];
  selectedTeams: string[];
  selectedProjects: string[];
  filterOptions: FilterOptions;
  onToggleTeam: (teamName: string) => void;
  onToggleProject: (projectName: string) => void;
  onSelectAllProjectTeams: (projectName: string) => void;
  onUpdateFilters: (options: Partial<FilterOptions>) => void;
  getUniqueProjects: () => string[];
  getTeamsByProject: (projectName: string) => DailyTeamData[];
}

export function ProjectTeamSelector({
  teamData,
  selectedTeams,
  selectedProjects,
  filterOptions,
  onToggleTeam,
  onToggleProject,
  onSelectAllProjectTeams,
  onUpdateFilters,
  getUniqueProjects,
  getTeamsByProject
}: ProjectTeamSelectorProps) {
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  
  const toggleProjectExpansion = (projectName: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectName) 
        ? prev.filter(name => name !== projectName)
        : [...prev, projectName]
    );
  };

  const expandAllProjects = () => {
    setExpandedProjects(getUniqueProjects());
  };

  const collapseAllProjects = () => {
    setExpandedProjects([]);
  };

  const getProjectTeamCount = (projectName: string) => {
    return getTeamsByProject(projectName).length;
  };

  const getSelectedProjectTeamCount = (projectName: string) => {
    return getTeamsByProject(projectName).filter(team => selectedTeams.includes(team.teamName)).length;
  };

  const filterItems = [
    { key: 'includeStories', label: 'Stories', icon: CheckCircle, color: 'text-green-600' },
    { key: 'includeDefects', label: 'Defects', icon: Bug, color: 'text-red-600' },
    { key: 'includeEpics', label: 'Epics', icon: AlertTriangle, color: 'text-orange-600' },
    { key: 'includeTeamLeads', label: 'Team Leads', icon: UserCheck, color: 'text-blue-600' }
  ] as const;

  return (
    <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-3">
            <FolderOpen className="w-6 h-6 text-primary" />
            <span>Project & Team Selection</span>
            <Badge variant="secondary" className="bg-primary/10">
              {selectedTeams.length} teams selected
            </Badge>
          </span>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={expandAllProjects}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAllProjects}>
              Collapse All
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Report Content Filters */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg border">
          <h4 className="text-sm font-semibold mb-3 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Include in Report</span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filterItems.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="flex items-center space-x-3 p-2 rounded-md hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
                <Checkbox
                  id={`filter-${key}`}
                  checked={filterOptions[key]}
                  onCheckedChange={(checked) => onUpdateFilters({ [key]: checked as boolean })}
                />
                <label htmlFor={`filter-${key}`} className="flex items-center space-x-2 cursor-pointer">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Project & Team Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Select Projects & Teams</span>
          </h4>
          
          <div className="space-y-2">
            {getUniqueProjects().map((projectName) => (
              <Card key={projectName} className="border border-gray-200 dark:border-gray-700">
                <Collapsible
                  open={expandedProjects.includes(projectName)}
                  onOpenChange={() => toggleProjectExpansion(projectName)}
                >
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="py-3 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {expandedProjects.includes(projectName) ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                          }
                          <FolderOpen className="w-5 h-5 text-primary" />
                          <span className="font-medium">{projectName}</span>
                          <Badge variant="outline" className="text-xs">
                            {getSelectedProjectTeamCount(projectName)}/{getProjectTeamCount(projectName)} teams
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAllProjectTeams(projectName);
                          }}
                          className="flex items-center space-x-1"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span className="text-xs">Select All</span>
                        </Button>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-7">
                        {getTeamsByProject(projectName).map((team) => (
                          <div 
                            key={team.id} 
                            className={`flex items-center space-x-3 p-3 rounded-lg border transition-all hover:shadow-sm ${
                              selectedTeams.includes(team.teamName) 
                                ? 'bg-primary/5 border-primary/20' 
                                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <Checkbox
                              id={`team-${team.id}`}
                              checked={selectedTeams.includes(team.teamName)}
                              onCheckedChange={() => onToggleTeam(team.teamName)}
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={`team-${team.id}`}
                                className="text-sm font-medium cursor-pointer block"
                              >
                                {team.teamName}
                              </label>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                  {team.stories.done + team.stories.inProgress + team.stories.notStarted} stories
                                </Badge>
                                <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                                  {team.defects.critical + team.defects.high + team.defects.medium + team.defects.low} defects
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
          
          {getUniqueProjects().length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No projects available. Fetch data to see projects and teams.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

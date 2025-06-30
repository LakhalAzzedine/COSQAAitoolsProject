import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Download, 
  RefreshCw, 
  Bug, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Mail,
  ChevronDown,
  ChevronUp,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJiraDashboard } from "@/hooks/useJiraDashboard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DailyTeamData, DefectBreakdown } from "@/types/jiraDashboard";
import { ProjectTeamSelector } from "./ProjectTeamSelector";
import { AIProgressSpinner } from "@/components/ui/ai-progress-spinner";

export function JiraDailyDashboard() {
  const [expandedTeams, setExpandedTeams] = useState<string[]>([]);
  const [managerEmail, setManagerEmail] = useState("");
  
  const { 
    isLoading,
    isGeneratingReport,
    progressMessages,
    teamData, 
    selectedTeams,
    selectedProjects,
    filterOptions,
    fetchDailyData, 
    toggleTeamSelection,
    toggleProjectSelection,
    selectAllProjectTeams,
    updateFilterOptions,
    generateReport,
    sendReportByEmail,
    getUniqueProjects,
    getTeamsByProject
  } = useJiraDashboard();

  const { toast } = useToast();

  // Auto-fetch data on component mount
  useEffect(() => {
    fetchDailyData();
  }, []);

  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const expandAllTeams = () => {
    setExpandedTeams(teamData.map(team => team.id));
  };

  const collapseAllTeams = () => {
    setExpandedTeams([]);
  };

  const getTotalDefects = (defects: DefectBreakdown): number => {
    return defects.critical + defects.high + defects.medium + defects.low;
  };

  const getDefectSeverityColor = (severity: keyof DefectBreakdown): string => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (count: number) => {
    if (count === 0) return null;
    return count > 0 ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Daily Jira Dashboard</h1>
            <p className="text-muted-foreground">Live team metrics and status updates</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Daily Updates
          </Badge>
          <Button onClick={() => fetchDailyData()} disabled={isLoading} size="sm">
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* AI Progress Spinner for Data Fetching */}
      <AIProgressSpinner 
        isVisible={isLoading} 
        messages={progressMessages}
      />

      {/* Enhanced Project & Team Selection */}
      {!isLoading && (
        <ProjectTeamSelector
          teamData={teamData}
          selectedTeams={selectedTeams}
          selectedProjects={selectedProjects}
          filterOptions={filterOptions}
          onToggleTeam={toggleTeamSelection}
          onToggleProject={toggleProjectSelection}
          onSelectAllProjectTeams={selectAllProjectTeams}
          onUpdateFilters={updateFilterOptions}
          getUniqueProjects={getUniqueProjects}
          getTeamsByProject={getTeamsByProject}
        />
      )}

      {/* Report Actions */}
      {!isLoading && (
        <Card>
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-sm font-medium">
                  {selectedTeams.length === 0 ? 'No teams selected' : `${selectedTeams.length} team(s) selected`}
                </span>
                <p className="text-xs text-muted-foreground">
                  Generate reports with selected teams and filters
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={generateReport} 
                  disabled={selectedTeams.length === 0 || isGeneratingReport}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isGeneratingReport ? 'Generating...' : 'Generate PDF Report'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => sendReportByEmail(managerEmail)} 
                  disabled={selectedTeams.length === 0 || isGeneratingReport}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Progress Spinner for Report Generation */}
      <AIProgressSpinner 
        isVisible={isGeneratingReport} 
        messages={progressMessages}
      />

      {/* Team Dashboard Grid */}
      {!isLoading && !isGeneratingReport && (
        <div className="space-y-4">
          {teamData.map((team) => (
            <Card key={team.id} className="border-2">
              <Collapsible 
                open={expandedTeams.includes(team.id)}
                onOpenChange={() => toggleTeamExpansion(team.id)}
              >
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="hover:bg-accent/50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5" />
                        <span>{team.teamName}</span>
                        {team.projectName && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-700">
                            {team.projectName}
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          {getTotalDefects(team.defects)} defects
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {expandedTeams.includes(team.id) ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                        }
                      </div>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Stories Section */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>Stories</span>
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-600">Done</span>
                            <Badge variant="outline" className="bg-green-100 text-green-700">
                              {team.stories.done}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-blue-600">In Progress</span>
                            <Badge variant="outline" className="bg-blue-100 text-blue-700">
                              {team.stories.inProgress}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-amber-600">Not Started</span>
                            <Badge variant="outline" className="bg-amber-100 text-amber-700">
                              {team.stories.notStarted}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Defects Section */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center space-x-2">
                          <Bug className="w-4 h-4" />
                          <span>Defects</span>
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(team.defects).map(([severity, count]) => (
                            <div key={severity} className="flex justify-between items-center">
                              <span className="text-sm capitalize">{severity}</span>
                              <Badge 
                                variant="outline" 
                                className={`${getDefectSeverityColor(severity as keyof DefectBreakdown)} text-white`}
                              >
                                {count}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Epics & Team Lead Section */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Epics & Lead</span>
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-600">Epic Done</span>
                            <Badge variant="outline" className="bg-green-100 text-green-700">
                              {team.epics.done}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-blue-600">Epic In Progress</span>
                            <Badge variant="outline" className="bg-blue-100 text-blue-700">
                              {team.epics.inProgress}
                            </Badge>
                          </div>
                          <div className="pt-2 border-t">
                            <span className="text-sm font-medium">Team Lead:</span>
                            <p className="text-sm text-muted-foreground">{team.teamLead.name}</p>
                            {team.teamLead.email && (
                              <p className="text-xs text-muted-foreground">{team.teamLead.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Fetching daily dashboard data...</span>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!isLoading && teamData.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Dashboard Data Available</h3>
              <p className="text-muted-foreground">
                No daily team data received from the backend service.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

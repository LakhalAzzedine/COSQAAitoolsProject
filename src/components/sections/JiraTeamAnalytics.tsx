
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Download, 
  RefreshCw, 
  Bug, 
  FileText, 
  Filter,
  Grid3X3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useJiraTeamAnalytics } from "@/hooks/useJiraTeamAnalytics";

export function JiraTeamAnalytics() {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  
  const { 
    isLoading, 
    teamData, 
    defectsData, 
    fetchAllData, 
    exportReport 
  } = useJiraTeamAnalytics();

  const { toast } = useToast();

  // Auto-fetch data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-refresh every 30 seconds for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleTeamSelection = (teamName: string, checked: boolean) => {
    if (checked) {
      setSelectedTeams([...selectedTeams, teamName]);
    } else {
      setSelectedTeams(selectedTeams.filter(team => team !== teamName));
    }
  };

  const handleGenerateReport = async () => {
    if (selectedTeams.length === 0) {
      toast({
        title: "No Teams Selected",
        description: "Please select at least one team to generate a report.",
        variant: "destructive",
      });
      return;
    }

    const filteredData = {
      teams: selectedTeams,
      teamData: teamData.filter(team => selectedTeams.includes(team.teamName)),
      defectsData: defectsData.filter(defect => selectedTeams.includes(defect.teamName)),
      selectedTeams
    };

    await exportReport(filteredData);
  };

  const allTeams = [...new Set([...teamData.map(d => d.teamName), ...defectsData.map(s => s.teamName)])];

  const filteredTeamData = selectedTeams.length === 0 ? teamData : teamData.filter(team => selectedTeams.includes(team.teamName));
  const filteredDefectsData = selectedTeams.length === 0 ? defectsData : defectsData.filter(defect => selectedTeams.includes(defect.teamName));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Jira Team Analytics</h1>
            <p className="text-muted-foreground">Live team data from backend service</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Live Data
          </Badge>
          <Button onClick={() => fetchAllData()} disabled={isLoading} size="sm">
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Team Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Team Selection & Filtering</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {allTeams.map((team) => (
              <div key={team} className="flex items-center space-x-2">
                <Checkbox
                  id={`team-${team}`}
                  checked={selectedTeams.includes(team)}
                  onCheckedChange={(checked) => handleTeamSelection(team, checked as boolean)}
                />
                <label
                  htmlFor={`team-${team}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {team}
                </label>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {selectedTeams.length === 0 ? 'All teams shown' : `${selectedTeams.length} team(s) selected`}
            </span>
            <Button onClick={handleGenerateReport} disabled={selectedTeams.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Data Grid */}
      {filteredTeamData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Grid3X3 className="w-5 h-5" />
              <span>Team Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeamData.map((team, index) => (
                <Card key={team.id} className="border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>{team.teamName}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: team.htmlContent }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Defects Data Grid */}
      {filteredDefectsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bug className="w-5 h-5" />
              <span>Defects Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDefectsData.map((defect, index) => (
                <Card key={defect.id} className="border-2 border-red-200 dark:border-red-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Bug className="w-4 h-4 text-red-500" />
                      <span>{defect.teamName} - Defects</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: defect.htmlContent }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Fetching live data from backend service...</span>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!isLoading && teamData.length === 0 && defectsData.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Data Available</h3>
              <p className="text-muted-foreground">
                No team or defects data received from the backend service.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

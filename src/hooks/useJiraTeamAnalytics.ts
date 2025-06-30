
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";

interface TeamData {
  teamName: string;
  htmlContent: string;
  id: string;
}

interface DefectData {
  teamName: string;
  htmlContent: string;
  id: string;
}

export function useJiraTeamAnalytics() {
  const [isLoading, setIsLoading] = useState(false);
  const [teamData, setTeamData] = useState<TeamData[]>([]);
  const [defectsData, setDefectsData] = useState<DefectData[]>([]);
  const { toast } = useToast();

  const fetchTeamData = async () => {
    setIsLoading(true);
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const teamEndpointUrl = getToolEndpointUrl("jira-team-data", config);
      console.log(`Fetching team data from backend`);

      const response = await fetch(teamEndpointUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Process the HTML data for teams
      const processedTeamData = result.teams?.map((team: any, index: number) => ({
        teamName: team.name || `Team ${index + 1}`,
        htmlContent: team.htmlContent || team.html || '',
        id: team.id || `team-${index}`
      })) || [];

      setTeamData(processedTeamData);

      toast({
        title: "Team Data Updated",
        description: `Fetched data for ${processedTeamData.length} teams.`,
      });

    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: "Fetch Failed",
        description: "Could not fetch team data. Check your connection and configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDefectsData = async () => {
    setIsLoading(true);
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const defectsEndpointUrl = getToolEndpointUrl("jira-defects-data", config);
      console.log(`Fetching defects data from backend`);

      const response = await fetch(defectsEndpointUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Process the HTML data for defects
      const processedDefectsData = result.defects?.map((defect: any, index: number) => ({
        teamName: defect.teamName || defect.team || `Team ${index + 1}`,
        htmlContent: defect.htmlContent || defect.html || '',
        id: defect.id || `defect-${index}`
      })) || [];

      setDefectsData(processedDefectsData);

      toast({
        title: "Defects Data Updated",
        description: `Fetched defects data for ${processedDefectsData.length} teams.`,
      });

    } catch (error) {
      console.error('Error fetching defects data:', error);
      toast({
        title: "Fetch Failed",
        description: "Could not fetch defects data. Check your connection and configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([fetchTeamData(), fetchDefectsData()]);
  };

  const exportReport = async (filteredData: any) => {
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("report-export", config);

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...filteredData,
          reportType: 'team-analytics-filtered',
          timestamp: new Date().toISOString(),
          qaTeamSelection: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qa-team-analytics-${filteredData.teams.join('-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report Generated",
        description: `Team analytics report for ${filteredData.teams.length} selected team(s) has been downloaded.`,
      });

    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Export Failed",
        description: "Could not export the filtered report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    isLoading,
    teamData,
    defectsData,
    fetchAllData,
    fetchTeamData,
    fetchDefectsData,
    exportReport
  };
}

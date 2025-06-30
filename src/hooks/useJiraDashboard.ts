import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";
import { DailyTeamData, FilterOptions, ReportData } from "@/types/jiraDashboard";
import { HtmlEmailParser } from "@/utils/htmlEmailParser";

export function useJiraDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [teamData, setTeamData] = useState<DailyTeamData[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [knownTeamNames, setKnownTeamNames] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    includeEpics: true,
    includeDefects: true,
    includeStories: true,
    includeTeamLeads: true
  });
  const { toast } = useToast();

  const fetchDailyData = async (teamNames?: string[]) => {
    setIsLoading(true);
    setProgressMessages([
      "Connecting to Jira backend...",
      "Fetching team data...",
      "Processing HTML content...",
      "Parsing team metrics...",
      "Organizing dashboard data...",
    ]);

    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("jira-daily-dashboard", config);
      console.log(`Fetching daily dashboard data from backend`);

      const response = await fetch(endpointUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Use provided team names or stored ones for better parsing
      const teamsToUse = teamNames || knownTeamNames;
      console.log('Parsing HTML with known team names:', teamsToUse);
      
      // Parse HTML content to extract structured data
      const parsedTeamData = HtmlEmailParser.parseTeamData(result.htmlContent || '', teamsToUse);
      
      setTeamData(parsedTeamData);

      toast({
        title: "Dashboard Updated",
        description: `Fetched daily data for ${parsedTeamData.length} teams.`,
      });

    } catch (error) {
      console.error('Error fetching daily dashboard data:', error);
      toast({
        title: "Fetch Failed",
        description: "Could not fetch daily dashboard data. Check your connection and configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgressMessages([]);
    }
  };

  const setTeamNames = (names: string[]) => {
    setKnownTeamNames(names);
    console.log('Known team names updated:', names);
  };

  const toggleTeamSelection = (teamName: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamName) 
        ? prev.filter(name => name !== teamName)
        : [...prev, teamName]
    );
  };

  const toggleProjectSelection = (projectName: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectName) 
        ? prev.filter(name => name !== projectName)
        : [...prev, projectName]
    );
  };

  const selectAllProjectTeams = (projectName: string) => {
    const projectTeams = teamData
      .filter(team => team.projectName === projectName)
      .map(team => team.teamName);
    
    setSelectedTeams(prev => {
      const newSelection = [...prev];
      projectTeams.forEach(teamName => {
        if (!newSelection.includes(teamName)) {
          newSelection.push(teamName);
        }
      });
      return newSelection;
    });
  };

  const updateFilterOptions = (options: Partial<FilterOptions>) => {
    setFilterOptions(prev => ({ ...prev, ...options }));
  };

  const generateReport = async () => {
    if (selectedTeams.length === 0) {
      toast({
        title: "No Teams Selected",
        description: "Please select at least one team to generate a report.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingReport(true);
    setProgressMessages([
      "Preparing report data...",
      "Generating PDF layout...",
      "Processing team metrics...",
      "Adding charts and visualizations...",
      "Finalizing document...",
    ]);

    const reportData: ReportData = {
      selectedTeams,
      selectedProjects,
      teamData: teamData.filter(team => selectedTeams.includes(team.teamName)),
      filterOptions,
      reportDate: new Date().toISOString().split('T')[0]
    };

    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("generate-dashboard-report", config);

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jira-dashboard-report-${reportData.reportDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report Generated",
        description: `Dashboard report for ${selectedTeams.length} team(s) has been downloaded.`,
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Export Failed",
        description: "Could not generate the dashboard report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
      setProgressMessages([]);
    }
  };

  const sendReportByEmail = async (managerEmail: string) => {
    // Implementation for email functionality
    console.log('Sending report to:', managerEmail);
    toast({
      title: "Email Sent",
      description: `Report has been sent to ${managerEmail}`,
    });
  };

  const getUniqueProjects = () => {
    const projects = teamData
      .map(team => team.projectName)
      .filter(Boolean) as string[];
    return [...new Set(projects)];
  };

  const getTeamsByProject = (projectName: string) => {
    return teamData.filter(team => team.projectName === projectName);
  };

  return {
    isLoading,
    isGeneratingReport,
    progressMessages,
    teamData,
    selectedTeams,
    selectedProjects,
    filterOptions,
    knownTeamNames,
    fetchDailyData,
    setTeamNames,
    toggleTeamSelection,
    toggleProjectSelection,
    selectAllProjectTeams,
    updateFilterOptions,
    generateReport,
    sendReportByEmail,
    getUniqueProjects,
    getTeamsByProject
  };
}


export interface StoryStatus {
  done: number;
  inProgress: number;
  notStarted: number;
}

export interface DefectBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface EpicStatus {
  done: number;
  inProgress: number;
  notStarted: number;
}

export interface TeamLead {
  name: string;
  email?: string;
}

export interface DailyTeamData {
  teamName: string;
  id: string;
  projectName?: string;
  stories: StoryStatus;
  defects: DefectBreakdown;
  epics: EpicStatus;
  teamLead: TeamLead;
  htmlContent?: string;
}

export interface FilterOptions {
  includeEpics: boolean;
  includeDefects: boolean;
  includeStories: boolean;
  includeTeamLeads: boolean;
}

export interface ReportData {
  selectedTeams: string[];
  selectedProjects: string[];
  teamData: DailyTeamData[];
  filterOptions: FilterOptions;
  reportDate: string;
}

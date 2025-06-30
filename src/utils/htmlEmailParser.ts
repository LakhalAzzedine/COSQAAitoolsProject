import { DailyTeamData, StoryStatus, DefectBreakdown, EpicStatus, TeamLead } from "@/types/jiraDashboard";

export class HtmlEmailParser {
  static parseTeamData(htmlContent: string, knownTeamNames?: string[]): DailyTeamData[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const teamDataMap = new Map<string, DailyTeamData>();
    
    // Look for project tables and team data within them
    const tables = doc.querySelectorAll('table');
    
    tables.forEach((table) => {
      this.parseTableForTeams(table, teamDataMap, knownTeamNames);
    });
    
    // Also check for team sections outside of tables
    const teamSections = doc.querySelectorAll('[data-team], .team-section, h2, h3, tr, td');
    teamSections.forEach((section) => {
      this.parseElementForTeam(section, teamDataMap, knownTeamNames);
    });
    
    return Array.from(teamDataMap.values());
  }
  
  private static parseTableForTeams(table: Element, teamDataMap: Map<string, DailyTeamData>, knownTeamNames?: string[]) {
    const rows = table.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
      const cells = row.querySelectorAll('td, th');
      
      cells.forEach((cell) => {
        const teamName = this.extractTeamNameFromText(cell.textContent || '', knownTeamNames);
        
        if (teamName) {
          const existingTeam = teamDataMap.get(teamName);
          const teamData = existingTeam || this.createEmptyTeamData(teamName, `${teamName}-${index}`);
          
          // Extract data from the current row/context
          const rowText = row.textContent || '';
          const tableText = table.textContent || '';
          
          // Merge/update team data
          this.updateTeamDataFromContext(teamData, row, table);
          
          teamDataMap.set(teamName, teamData);
        }
      });
    });
  }
  
  private static parseElementForTeam(element: Element, teamDataMap: Map<string, DailyTeamData>, knownTeamNames?: string[]) {
    const teamName = this.extractTeamNameFromElement(element, knownTeamNames);
    if (!teamName) return;
    
    const existingTeam = teamDataMap.get(teamName);
    const teamData = existingTeam || this.createEmptyTeamData(teamName, `team-${teamName.toLowerCase().replace(/\s+/g, '-')}`);
    
    this.updateTeamDataFromContext(teamData, element, element.closest('table') || element);
    
    teamDataMap.set(teamName, teamData);
  }
  
  private static extractTeamNameFromElement(element: Element, knownTeamNames?: string[]): string | null {
    const text = element.textContent || '';
    
    // Try different patterns for team names
    let match = text.match(/Team:\s*(.+)/i);
    if (match) return this.normalizeTeamName(match[1].trim());
    
    // Check if element contains any known team names
    if (knownTeamNames) {
      for (const teamName of knownTeamNames) {
        if (text.toLowerCase().includes(teamName.toLowerCase())) {
          return teamName;
        }
      }
    }
    
    // Pattern for header text
    if (element.tagName === 'H2' || element.tagName === 'H3' || element.tagName === 'TH') {
      const cleanText = this.normalizeTeamName(text);
      if (cleanText && cleanText.length > 2) {
        return cleanText;
      }
    }
    
    // Data attribute
    const teamAttr = element.getAttribute('data-team');
    if (teamAttr) return this.normalizeTeamName(teamAttr);
    
    return null;
  }
  
  private static extractTeamNameFromText(text: string, knownTeamNames?: string[]): string | null {
    if (!text) return null;
    
    // Check against known team names first
    if (knownTeamNames) {
      for (const teamName of knownTeamNames) {
        if (text.toLowerCase().includes(teamName.toLowerCase())) {
          return teamName;
        }
      }
    }
    
    // Pattern matching for team names
    const patterns = [
      /Team:\s*([^,\n\t]+)/i,
      /Team\s+([A-Za-z][A-Za-z0-9\s-_]+)/i,
      /([A-Za-z][A-Za-z0-9\s-_]+)\s*Team/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const teamName = this.normalizeTeamName(match[1]);
        if (teamName && teamName.length > 2) {
          return teamName;
        }
      }
    }
    
    return null;
  }
  
  private static normalizeTeamName(name: string): string {
    return name.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ');
  }
  
  private static createEmptyTeamData(teamName: string, id: string): DailyTeamData {
    return {
      teamName,
      id,
      stories: { done: 0, inProgress: 0, notStarted: 0 },
      defects: { critical: 0, high: 0, medium: 0, low: 0 },
      epics: { done: 0, inProgress: 0, notStarted: 0 },
      teamLead: { name: 'Unknown' },
      htmlContent: ''
    };
  }
  
  private static updateTeamDataFromContext(teamData: DailyTeamData, element: Element, context: Element) {
    const contextText = context.textContent || '';
    
    // Update stories (accumulate values)
    const stories = this.extractStoryStatus(element, context);
    teamData.stories.done += stories.done;
    teamData.stories.inProgress += stories.inProgress;
    teamData.stories.notStarted += stories.notStarted;
    
    // Update defects (accumulate values)
    const defects = this.extractDefectBreakdown(element, context);
    teamData.defects.critical += defects.critical;
    teamData.defects.high += defects.high;
    teamData.defects.medium += defects.medium;
    teamData.defects.low += defects.low;
    
    // Update epics (accumulate values)
    const epics = this.extractEpicStatus(element, context);
    teamData.epics.done += epics.done;
    teamData.epics.inProgress += epics.inProgress;
    teamData.epics.notStarted += epics.notStarted;
    
    // Update team lead (keep first found or most specific)
    const teamLead = this.extractTeamLead(element, context);
    if (teamLead.name !== 'Unknown' && teamData.teamLead.name === 'Unknown') {
      teamData.teamLead = teamLead;
    }
    
    // Append HTML content
    if (!teamData.htmlContent) {
      teamData.htmlContent = '';
    }
    teamData.htmlContent += element.outerHTML + '\n';
  }
  
  private static extractStoryStatus(element: Element, context: Element): StoryStatus {
    const text = context.textContent || '';
    const elementText = element.textContent || '';
    
    return {
      done: this.extractNumber(text, /(?:stories?\s+)?done[:\s]*(\d+)/i) || 
            this.extractNumber(elementText, /done[:\s]*(\d+)/i) || 0,
      inProgress: this.extractNumber(text, /(?:stories?\s+)?in\s*progress[:\s]*(\d+)/i) || 
                  this.extractNumber(elementText, /in\s*progress[:\s]*(\d+)/i) || 0,
      notStarted: this.extractNumber(text, /(?:stories?\s+)?(not\s*started|to\s*do)[:\s]*(\d+)/i) || 
                  this.extractNumber(elementText, /(not\s*started|to\s*do)[:\s]*(\d+)/i) || 0
    };
  }
  
  private static extractDefectBreakdown(element: Element, context: Element): DefectBreakdown {
    const text = context.textContent || '';
    const elementText = element.textContent || '';
    
    return {
      critical: this.extractNumber(text, /critical[:\s]*(\d+)/i) || 
                this.extractNumber(elementText, /critical[:\s]*(\d+)/i) || 0,
      high: this.extractNumber(text, /high[:\s]*(\d+)/i) || 
            this.extractNumber(elementText, /high[:\s]*(\d+)/i) || 0,
      medium: this.extractNumber(text, /medium[:\s]*(\d+)/i) || 
              this.extractNumber(elementText, /medium[:\s]*(\d+)/i) || 0,
      low: this.extractNumber(text, /low[:\s]*(\d+)/i) || 
           this.extractNumber(elementText, /low[:\s]*(\d+)/i) || 0
    };
  }
  
  private static extractEpicStatus(element: Element, context: Element): EpicStatus {
    const text = context.textContent || '';
    const elementText = element.textContent || '';
    
    return {
      done: this.extractNumber(text, /epic[s]*\s*done[:\s]*(\d+)/i) || 
            this.extractNumber(elementText, /epic[s]*\s*done[:\s]*(\d+)/i) || 0,
      inProgress: this.extractNumber(text, /epic[s]*\s*in\s*progress[:\s]*(\d+)/i) || 
                  this.extractNumber(elementText, /epic[s]*\s*in\s*progress[:\s]*(\d+)/i) || 0,
      notStarted: this.extractNumber(text, /epic[s]*\s*(not\s*started|to\s*do)[:\s]*(\d+)/i) || 
                  this.extractNumber(elementText, /epic[s]*\s*(not\s*started|to\s*do)[:\s]*(\d+)/i) || 0
    };
  }
  
  private static extractTeamLead(element: Element, context: Element): TeamLead {
    const text = context.textContent || '';
    const elementText = element.textContent || '';
    
    const nameMatch = text.match(/(?:lead|manager)[:\s]*([^,\n\t]+)/i) || 
                     elementText.match(/(?:lead|manager)[:\s]*([^,\n\t]+)/i);
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/) || 
                      elementText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    
    return {
      name: nameMatch ? this.normalizeTeamName(nameMatch[1]) : 'Unknown',
      email: emailMatch ? emailMatch[1] : undefined
    };
  }
  
  private static extractNumber(text: string, pattern: RegExp): number | null {
    const match = text.match(pattern);
    if (match) {
      // Handle cases where the number might be in different capture groups
      for (let i = 1; i < match.length; i++) {
        const num = parseInt(match[i], 10);
        if (!isNaN(num)) {
          return num;
        }
      }
    }
    return null;
  }
}

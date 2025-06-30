
export interface JQLQueryOptions {
  projects?: string[];
  assignees?: string[];
  statuses?: string[];
  priorities?: string[];
  issueTypes?: string[];
  dateRange?: {
    field: 'created' | 'updated' | 'resolved';
    from?: string;
    to?: string;
  };
  teams?: string[];
}

export class JQLQueryBuilder {
  private conditions: string[] = [];

  static create(): JQLQueryBuilder {
    return new JQLQueryBuilder();
  }

  projects(projects: string[]): JQLQueryBuilder {
    if (projects.length > 0) {
      const projectList = projects.map(p => `"${p}"`).join(', ');
      this.conditions.push(`project in (${projectList})`);
    }
    return this;
  }

  assignees(assignees: string[]): JQLQueryBuilder {
    if (assignees.length > 0) {
      const assigneeList = assignees.map(a => `"${a}"`).join(', ');
      this.conditions.push(`assignee in (${assigneeList})`);
    }
    return this;
  }

  statuses(statuses: string[]): JQLQueryBuilder {
    if (statuses.length > 0) {
      const statusList = statuses.map(s => `"${s}"`).join(', ');
      this.conditions.push(`status in (${statusList})`);
    }
    return this;
  }

  priorities(priorities: string[]): JQLQueryBuilder {
    if (priorities.length > 0) {
      const priorityList = priorities.map(p => `"${p}"`).join(', ');
      this.conditions.push(`priority in (${priorityList})`);
    }
    return this;
  }

  issueTypes(types: string[]): JQLQueryBuilder {
    if (types.length > 0) {
      const typeList = types.map(t => `"${t}"`).join(', ');
      this.conditions.push(`issuetype in (${typeList})`);
    }
    return this;
  }

  dateRange(field: 'created' | 'updated' | 'resolved', from?: string, to?: string): JQLQueryBuilder {
    if (from && to) {
      this.conditions.push(`${field} >= "${from}" AND ${field} <= "${to}"`);
    } else if (from) {
      this.conditions.push(`${field} >= "${from}"`);
    } else if (to) {
      this.conditions.push(`${field} <= "${to}"`);
    }
    return this;
  }

  onlyDefects(): JQLQueryBuilder {
    this.conditions.push('issuetype = "Bug"');
    return this;
  }

  onlyStories(): JQLQueryBuilder {
    this.conditions.push('issuetype in ("Story", "Epic", "Task")');
    return this;
  }

  excludeEmptyAssignee(): JQLQueryBuilder {
    this.conditions.push('assignee is not EMPTY');
    return this;
  }

  customCondition(condition: string): JQLQueryBuilder {
    this.conditions.push(condition);
    return this;
  }

  build(): string {
    return this.conditions.join(' AND ');
  }

  // Pre-built queries for common use cases
  static getDefectsForTeams(projects: string[]): string {
    return JQLQueryBuilder.create()
      .projects(projects)
      .onlyDefects()
      .excludeEmptyAssignee()
      .build();
  }

  static getStoriesForTeams(projects: string[]): string {
    return JQLQueryBuilder.create()
      .projects(projects)
      .onlyStories()
      .excludeEmptyAssignee()
      .build();
  }

  static getTeamWorkload(projects: string[], assignees: string[]): string {
    return JQLQueryBuilder.create()
      .projects(projects)
      .assignees(assignees)
      .statuses(['Open', 'In Progress', 'Ready for Testing'])
      .build();
  }
}

// Helper functions for common JQL patterns
export const jqlHelpers = {
  escapeValue: (value: string): string => {
    return `"${value.replace(/"/g, '\\"')}"`;
  },

  formatDate: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },

  getLastNDays: (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return jqlHelpers.formatDate(date);
  },

  getCurrentSprint: (): string => {
    return 'Sprint in openSprints()';
  },

  getActiveSprints: (): string => {
    return 'Sprint in (openSprints(), futureSprints())';
  }
};


export interface DefectCategory {
  name: string;
  keywords: string[];
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  commonCauses: string[];
  preventionStrategies: string[];
}

export interface RootCauseAnalysis {
  id: string;
  primaryCause: string;
  contributingFactors: string[];
  category: string;
  severity: string;
  priority: string;
  impactAreas: string[];
  preventionMeasures: string[];
  testingGaps: string[];
  recommendedActions: string[];
  rootCause: string;
  testingGap: string;
  preventionStrategy: string;
  riskLevel: string;
  recommendations: string[];
  confidence: number;
  aiEnhanced?: boolean;
}

export interface DefectAnalysisResult extends RootCauseAnalysis {}

export interface DefectPattern {
  pattern: string;
  description: string;
  frequency: number;
  preventionStrategy: string;
}

export const defectCategories: DefectCategory[] = [
  {
    name: "Functional Defects",
    keywords: ["function", "feature", "requirement", "specification", "behavior", "logic"],
    severity: "High",
    commonCauses: [
      "Incomplete or misunderstood requirements",
      "Poor requirement documentation",
      "Lack of business logic validation",
      "Integration issues between components"
    ],
    preventionStrategies: [
      "Implement comprehensive requirement reviews",
      "Use behavior-driven development (BDD)",
      "Create detailed acceptance criteria",
      "Establish clear definition of done"
    ]
  },
  {
    name: "UI/UX Defects",
    keywords: ["interface", "display", "layout", "responsive", "design", "usability", "accessibility"],
    severity: "Medium",
    commonCauses: [
      "Inconsistent design system implementation",
      "Lack of cross-browser testing",
      "Missing accessibility considerations",
      "Responsive design not tested across devices"
    ],
    preventionStrategies: [
      "Implement design system components",
      "Automated visual regression testing",
      "Accessibility testing tools integration",
      "Multi-device testing strategy"
    ]
  },
  {
    name: "Performance Defects",
    keywords: ["slow", "timeout", "performance", "load", "speed", "memory", "cpu"],
    severity: "High",
    commonCauses: [
      "Inefficient database queries",
      "Memory leaks in frontend code",
      "Lack of caching strategies",
      "Unoptimized images and assets"
    ],
    preventionStrategies: [
      "Performance testing in CI/CD pipeline",
      "Code profiling and monitoring",
      "Implement caching strategies",
      "Regular performance audits"
    ]
  },
  {
    name: "Security Defects",
    keywords: ["security", "authentication", "authorization", "xss", "sql injection", "vulnerability"],
    severity: "Critical",
    commonCauses: [
      "Insufficient input validation",
      "Missing authentication/authorization checks",
      "Insecure data transmission",
      "Outdated dependencies with vulnerabilities"
    ],
    preventionStrategies: [
      "Security code reviews",
      "Static application security testing (SAST)",
      "Dynamic application security testing (DAST)",
      "Regular security audits and penetration testing"
    ]
  },
  {
    name: "Integration Defects",
    keywords: ["api", "integration", "service", "communication", "data flow", "synchronization"],
    severity: "High",
    commonCauses: [
      "API contract mismatches",
      "Data format inconsistencies",
      "Network connectivity issues",
      "Version compatibility problems"
    ],
    preventionStrategies: [
      "Contract-driven development",
      "API mocking for testing",
      "Comprehensive integration testing",
      "Service monitoring and alerting"
    ]
  },
  {
    name: "Data Defects",
    keywords: ["data", "database", "corruption", "validation", "integrity", "consistency"],
    severity: "High",
    commonCauses: [
      "Insufficient data validation",
      "Concurrent access issues",
      "Data migration problems",
      "Backup and recovery failures"
    ],
    preventionStrategies: [
      "Implement data validation at multiple layers",
      "Database integrity constraints",
      "Regular data quality audits",
      "Automated backup verification"
    ]
  }
];

export const severityLevels = ['Critical', 'High', 'Medium', 'Low'];

export class DefectAnalyzer {
  private defectCategories: DefectCategory[] = defectCategories;

  analyzeDefect(defectData: any): RootCauseAnalysis {
    const description = typeof defectData === 'string' ? defectData : defectData.description;
    const lowercaseDesc = description.toLowerCase();
    
    // Identify defect category
    let identifiedCategory = this.defectCategories.find(category =>
      category.keywords.some(keyword => lowercaseDesc.includes(keyword))
    ) || this.defectCategories[0];

    // Extract key information
    const severity = this.determineSeverity(lowercaseDesc, defectData.jiraData);
    const impactAreas = this.identifyImpactAreas(lowercaseDesc);
    const contributingFactors = this.identifyContributingFactors(lowercaseDesc, identifiedCategory);
    const primaryCause = this.identifyPrimaryCause(lowercaseDesc, identifiedCategory);
    const testingGaps = this.identifyTestingGaps(lowercaseDesc, identifiedCategory);
    const recommendedActions = this.generateRecommendedActions(lowercaseDesc, identifiedCategory, severity);
    
    return {
      id: `DEF-${Date.now()}`,
      primaryCause,
      contributingFactors,
      category: identifiedCategory.name,
      severity,
      priority: this.determinePriority(severity),
      impactAreas,
      preventionMeasures: identifiedCategory.preventionStrategies,
      testingGaps,
      recommendedActions,
      rootCause: primaryCause,
      testingGap: testingGaps[0] || 'No specific testing gaps identified',
      preventionStrategy: identifiedCategory.preventionStrategies[0] || 'Standard prevention measures apply',
      riskLevel: this.determineRiskLevel(severity),
      recommendations: recommendedActions,
      confidence: this.calculateConfidence(lowercaseDesc, identifiedCategory)
    };
  }

  private determineSeverity(description: string, jiraData?: any): string {
    // Check JIRA data first
    if (jiraData?.priority) {
      return jiraData.priority;
    }

    // Analyze description for severity indicators
    const criticalKeywords = ['critical', 'blocker', 'crash', 'data loss', 'security'];
    const highKeywords = ['major', 'functionality broken', 'cannot proceed', 'production'];
    const mediumKeywords = ['minor', 'workaround available', 'cosmetic'];

    if (criticalKeywords.some(keyword => description.includes(keyword))) {
      return 'Critical';
    } else if (highKeywords.some(keyword => description.includes(keyword))) {
      return 'High';
    } else if (mediumKeywords.some(keyword => description.includes(keyword))) {
      return 'Medium';
    }

    return 'Medium'; // Default
  }

  private determinePriority(severity: string): string {
    switch (severity) {
      case 'Critical': return 'Urgent';
      case 'High': return 'High';
      case 'Medium': return 'Medium';
      case 'Low': return 'Low';
      default: return 'Medium';
    }
  }

  private determineRiskLevel(severity: string): string {
    switch (severity) {
      case 'Critical': return 'High';
      case 'High': return 'High';
      case 'Medium': return 'Medium';
      case 'Low': return 'Low';
      default: return 'Medium';
    }
  }

  private calculateConfidence(description: string, category: DefectCategory): number {
    let confidence = 70; // Base confidence
    
    // Increase confidence based on keyword matches
    const matchedKeywords = category.keywords.filter(keyword => 
      description.includes(keyword)
    );
    confidence += matchedKeywords.length * 5;
    
    // Cap at 95%
    return Math.min(confidence, 95);
  }

  private identifyImpactAreas(description: string): string[] {
    const areas: string[] = [];
    
    if (description.includes('user') || description.includes('customer')) {
      areas.push('User Experience');
    }
    if (description.includes('data') || description.includes('database')) {
      areas.push('Data Integrity');
    }
    if (description.includes('performance') || description.includes('slow')) {
      areas.push('System Performance');
    }
    if (description.includes('security') || description.includes('unauthorized')) {
      areas.push('Security');
    }
    if (description.includes('integration') || description.includes('api')) {
      areas.push('System Integration');
    }

    return areas.length > 0 ? areas : ['Functionality'];
  }

  private identifyContributingFactors(description: string, category: DefectCategory): string[] {
    const factors: string[] = [];

    // Add common causes based on category
    factors.push(...category.commonCauses.slice(0, 2));

    // Add specific factors based on description analysis
    if (description.includes('requirement') || description.includes('specification')) {
      factors.push('Unclear or incomplete requirements');
    }
    if (description.includes('test') || description.includes('testing')) {
      factors.push('Insufficient test coverage');
    }
    if (description.includes('code review') || description.includes('review')) {
      factors.push('Inadequate code review process');
    }
    if (description.includes('environment') || description.includes('deployment')) {
      factors.push('Environment configuration issues');
    }

    return [...new Set(factors)]; // Remove duplicates
  }

  private identifyPrimaryCause(description: string, category: DefectCategory): string {
    // Use AI-like logic to determine most likely primary cause
    if (description.includes('requirement') && description.includes('missing')) {
      return 'Incomplete requirements specification';
    }
    if (description.includes('test') && description.includes('not')) {
      return 'Insufficient testing coverage';
    }
    if (description.includes('code') && description.includes('logic')) {
      return 'Logical error in implementation';
    }
    if (description.includes('integration') && description.includes('fail')) {
      return 'Integration point failure';
    }

    // Default to first common cause of the category
    return category.commonCauses[0];
  }

  private identifyTestingGaps(description: string, category: DefectCategory): string[] {
    const gaps: string[] = [];

    switch (category.name) {
      case 'Functional Defects':
        gaps.push('Missing unit tests for business logic');
        gaps.push('Incomplete integration test scenarios');
        break;
      case 'UI/UX Defects':
        gaps.push('Lack of visual regression testing');
        gaps.push('Missing accessibility testing');
        break;
      case 'Performance Defects':
        gaps.push('No performance testing in CI/CD');
        gaps.push('Missing load testing scenarios');
        break;
      case 'Security Defects':
        gaps.push('Insufficient security testing');
        gaps.push('Missing penetration testing');
        break;
      case 'Integration Defects':
        gaps.push('Inadequate API contract testing');
        gaps.push('Missing end-to-end test scenarios');
        break;
      case 'Data Defects':
        gaps.push('Insufficient data validation testing');
        gaps.push('Missing data migration testing');
        break;
    }

    return gaps;
  }

  private generateRecommendedActions(description: string, category: DefectCategory, severity: string): string[] {
    const actions: string[] = [];

    // Immediate actions based on severity
    if (severity === 'Critical') {
      actions.push('Implement hotfix and deploy immediately');
      actions.push('Conduct post-incident review within 24 hours');
    } else if (severity === 'High') {
      actions.push('Prioritize fix in current sprint');
      actions.push('Review similar code patterns for potential issues');
    }

    // Category-specific actions
    actions.push(...category.preventionStrategies.slice(0, 2));

    // General improvement actions
    actions.push('Update test cases to cover this scenario');
    actions.push('Review and update documentation');
    actions.push('Consider adding monitoring/alerting for early detection');

    return actions;
  }

  generateDefectReport(analysis: RootCauseAnalysis, originalDescription: string, jiraId?: string): string {
    return `
# Defect Analysis Report
${jiraId ? `**JIRA ID:** ${jiraId}\n` : ''}
**Analysis Date:** ${new Date().toLocaleDateString()}

## Executive Summary
**Category:** ${analysis.category}
**Severity:** ${analysis.severity}
**Primary Cause:** ${analysis.primaryCause}

## Root Cause Analysis

### Primary Cause
${analysis.primaryCause}

### Contributing Factors
${analysis.contributingFactors.map(factor => `- ${factor}`).join('\n')}

### Impact Areas
${analysis.impactAreas.map(area => `- ${area}`).join('\n')}

## Testing Gaps Identified
${analysis.testingGaps.map(gap => `- ${gap}`).join('\n')}

## Prevention Measures
${analysis.preventionMeasures.map(measure => `- ${measure}`).join('\n')}

## Recommended Actions
${analysis.recommendedActions.map(action => `- ${action}`).join('\n')}

## Original Defect Description
${originalDescription}

---
*This analysis was generated by AI-powered defect analysis. Please review and validate findings with domain experts.*
    `.trim();
  }
}

export const defectPreventionBestPractices = [
  "Implement shift-left testing practices",
  "Use static code analysis tools in CI/CD pipeline",
  "Conduct regular code reviews with focus on common defect patterns",
  "Maintain comprehensive test automation suite",
  "Implement monitoring and alerting for early defect detection",
  "Use behavior-driven development (BDD) for better requirement clarity",
  "Establish clear definition of done with quality gates",
  "Conduct regular technical debt assessments",
  "Implement pair programming for knowledge sharing",
  "Maintain defect taxonomy and lessons learned database"
];

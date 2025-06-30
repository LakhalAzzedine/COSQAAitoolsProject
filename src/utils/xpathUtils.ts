
export interface XPathStrategy {
  name: string;
  description: string;
  priority: number;
  generate: (element: string, context?: string) => string[];
}

export interface XPathValidationResult {
  xpath: string;
  isValid: boolean;
  specificity: number;
  robustness: number;
  maintainability: number;
  issues: string[];
  suggestions: string[];
}

export class XPathGenerator {
  private strategies: XPathStrategy[] = [
    {
      name: "ID-based",
      description: "Most reliable - uses element ID",
      priority: 1,
      generate: (element: string) => {
        const idMatches = element.match(/id=["']([^"']+)["']/g);
        return idMatches ? idMatches.map(match => {
          const id = match.match(/id=["']([^"']+)["']/)?.[1];
          return `//*[@id='${id}']`;
        }) : [];
      }
    },
    {
      name: "Class-based",
      description: "Good reliability - uses CSS classes",
      priority: 2,
      generate: (element: string) => {
        const classMatches = element.match(/class=["']([^"']+)["']/g);
        return classMatches ? classMatches.map(match => {
          const classes = match.match(/class=["']([^"']+)["']/)?.[1].split(' ');
          return classes ? classes.map(cls => `//*[@class='${cls}']`).slice(0, 3) : [];
        }).flat() : [];
      }
    },
    {
      name: "Attribute-based",
      description: "Moderate reliability - uses data attributes",
      priority: 3,
      generate: (element: string) => {
        const dataAttrs = element.match(/data-[a-zA-Z-]+=["'][^"']*["']/g) || [];
        const nameAttrs = element.match(/name=["'][^"']*["']/g) || [];
        const typeAttrs = element.match(/type=["'][^"']*["']/g) || [];
        
        return [...dataAttrs, ...nameAttrs, ...typeAttrs].map(attr => {
          const [key, value] = attr.split('=');
          const cleanValue = value.replace(/["']/g, '');
          return `//*[@${key}='${cleanValue}']`;
        });
      }
    },
    {
      name: "Text-based",
      description: "Use with caution - based on visible text",
      priority: 4,
      generate: (element: string) => {
        const textMatches = element.match(/>([^<]+)</g);
        return textMatches ? textMatches.map(match => {
          const text = match.replace(/[><]/g, '').trim();
          if (text.length > 2 && text.length < 50) {
            return [
              `//*[text()='${text}']`,
              `//*[contains(text(),'${text}')]`,
              `//*[normalize-space(text())='${text.trim()}']`
            ];
          }
          return [];
        }).flat() : [];
      }
    },
    {
      name: "Structural",
      description: "Hierarchical positioning - less reliable",
      priority: 5,
      generate: (element: string, context?: string) => {
        const tagMatch = element.match(/<(\w+)/);
        if (!tagMatch) return [];
        
        const tag = tagMatch[1];
        return [
          `//${tag}[1]`,
          `//div[contains(@class, 'container')]//${tag}`,
          `//main//${tag}`,
          `//section//${tag}`
        ];
      }
    }
  ];

  generateXPaths(htmlContent: string): { strategy: string; xpaths: string[] }[] {
    const results: { strategy: string; xpaths: string[] }[] = [];
    
    this.strategies.forEach(strategy => {
      const xpaths = strategy.generate(htmlContent, htmlContent);
      if (xpaths.length > 0) {
        results.push({
          strategy: strategy.name,
          xpaths: [...new Set(xpaths)] // Remove duplicates
        });
      }
    });

    return results.sort((a, b) => {
      const aPriority = this.strategies.find(s => s.name === a.strategy)?.priority || 999;
      const bPriority = this.strategies.find(s => s.name === b.strategy)?.priority || 999;
      return aPriority - bPriority;
    });
  }

  validateXPath(xpath: string, htmlContent: string): XPathValidationResult {
    const result: XPathValidationResult = {
      xpath,
      isValid: true,
      specificity: 0,
      robustness: 0,
      maintainability: 0,
      issues: [],
      suggestions: []
    };

    // Check XPath syntax
    try {
      // Basic XPath validation
      if (!xpath.startsWith('//') && !xpath.startsWith('/')) {
        result.issues.push('XPath should start with // or /');
        result.isValid = false;
      }

      // Calculate specificity (higher is more specific)
      if (xpath.includes('@id=')) result.specificity += 10;
      if (xpath.includes('@class=')) result.specificity += 7;
      if (xpath.includes('@data-')) result.specificity += 5;
      if (xpath.includes('text()=')) result.specificity += 3;
      if (xpath.includes('[position()=') || xpath.includes('[1]')) result.specificity += 2;

      // Calculate robustness (higher is more robust to changes)
      if (xpath.includes('@id=')) result.robustness += 10;
      if (xpath.includes('@data-testid=')) result.robustness += 9;
      if (xpath.includes('@role=')) result.robustness += 7;
      if (xpath.includes('contains(')) result.robustness += 5;
      if (xpath.includes('normalize-space(')) result.robustness += 4;
      if (xpath.match(/\[\d+\]/)) result.robustness -= 3; // Position-based selectors are fragile

      // Calculate maintainability
      const complexity = (xpath.match(/\//g) || []).length;
      result.maintainability = Math.max(0, 10 - complexity);

      // Generate suggestions
      if (result.robustness < 5) {
        result.suggestions.push('Consider using ID or data attributes for more robust selection');
      }
      if (xpath.match(/\[\d+\]/)) {
        result.suggestions.push('Avoid position-based selectors as they break easily when DOM changes');
      }
      if (complexity > 5) {
        result.suggestions.push('Simplify XPath - shorter paths are more maintainable');
      }
      if (!xpath.includes('contains(') && xpath.includes('text()=')) {
        result.suggestions.push('Consider using contains() for text matching to handle whitespace variations');
      }

    } catch (error) {
      result.isValid = false;
      result.issues.push('Invalid XPath syntax');
    }

    return result;
  }
}

export const xpathBestPractices = [
  "Prefer ID attributes when available - they're unique and reliable",
  "Use data-testid attributes for test automation selectors",
  "Avoid position-based selectors like [1], [2] as they break easily",
  "Use contains() for partial text matching to handle dynamic content",
  "Keep XPath expressions as short as possible for better performance",
  "Use normalize-space() to handle whitespace variations in text",
  "Prefer attribute-based selection over complex hierarchical paths",
  "Test XPaths against different browser environments",
  "Document complex XPath expressions with comments",
  "Consider CSS selectors as alternatives for simpler cases"
];

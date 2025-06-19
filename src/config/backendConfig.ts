// Backend Configuration for QA Tools
// This file contains all the prompts and endpoint configurations for each tool

export interface ToolPrompt {
  id: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  fileProcessingPrompt?: string;
  urlProcessingPrompt?: string;
  jiraProcessingPrompt?: string;
  endpointUrl?: string; // Tool-specific endpoint URL
}

export interface EndpointConfig {
  baseUrl: string;
  monitoringBaseUrl: string; // Separate base URL for monitoring services
  // Tool-specific endpoints
  testGeneratorEndpoint: string;
  acValidatorEndpoint: string;
  xpathGeneratorEndpoint: string;
  jsonAnalyzerEndpoint: string;
  adaAnalyzerEndpoint: string;
  lighthouseEndpoint: string;
  chatbotEndpoint: string;
  defectAnalyzerEndpoint: string;
  karateScriptEndpoint: string;
  smartspecScriptEndpoint: string;
  jiraIntegrationEndpoint: string;
  urlProcessingEndpoint: string;
  fileProcessingEndpoint: string;
  endpointsMonitorEndpoint: string;
  buildPipelinesEndpoint: string;
  sendMessageEndpoint: string; // Added sendmessage endpoint
}

// Default endpoint configuration - easily configurable
export const defaultEndpointConfig: EndpointConfig = {
  baseUrl: import.meta.env.VITE_BACKEND_URL || "http://localhost:3001",// Replace with your actual SVC backend URL
  monitoringBaseUrl: import.meta.env.VITE_MONITORING_URL || "http://localhost:3002",
  testGeneratorEndpoint: "/test-generator",
  acValidatorEndpoint: "/ac-validator",
  xpathGeneratorEndpoint: "/xpath-generator",
  jsonAnalyzerEndpoint: "/json-analyzer",
  adaAnalyzerEndpoint: "/ada-analyzer",
  lighthouseEndpoint: "/lighthouse",
  chatbotEndpoint: "/chatbot",
  defectAnalyzerEndpoint: "/defect-analyzer",
  karateScriptEndpoint: "/karate-script",
  smartspecScriptEndpoint: "/smartspec-script",
  jiraIntegrationEndpoint: "/jira-integration",
  urlProcessingEndpoint: "/url-processing",
  fileProcessingEndpoint: "/file-processing",
  endpointsMonitorEndpoint: "/endpoints-monitor",
  buildPipelinesEndpoint: "/build-pipelines",
  sendMessageEndpoint: "/sendmessage"
};

// Tool-specific prompts configuration
export const toolPrompts: ToolPrompt[] = [
  {
    id: "test-generator",
    name: "Test Generator",
    systemPrompt: "You are an expert QA engineer specialized in creating comprehensive test cases. Generate detailed, actionable test scenarios with clear steps, expected results, and edge cases.",
    userPromptTemplate: "Generate comprehensive test cases for the following requirements:\n\n{content}\n\nInclude positive, negative, and edge case scenarios.",
    fileProcessingPrompt: "Analyze the uploaded files and generate test cases based on the requirements, user stories, or specifications found in the files.",
    jiraProcessingPrompt: "Generate test cases for the Jira story: {title}\n\nDescription: {description}\n\nAcceptance Criteria:\n{acceptanceCriteria}",
    urlProcessingPrompt: "Analyze the website at the provided URL and generate appropriate test cases for its functionality and user interface."
  },
  {
    id: "ac-validator",
    name: "AC Validator", 
    systemPrompt: "You are an expert in acceptance criteria validation. Analyze acceptance criteria for completeness, clarity, testability, and adherence to best practices.",
    userPromptTemplate: "Validate the following acceptance criteria for completeness and quality:\n\n{content}\n\nProvide specific feedback and improvement suggestions.",
    fileProcessingPrompt: "Extract and validate acceptance criteria from the uploaded files. Identify missing elements and suggest improvements.",
    jiraProcessingPrompt: "Validate the acceptance criteria for Jira story {title}:\n\n{acceptanceCriteria}\n\nCheck for completeness, clarity, and testability.",
    urlProcessingPrompt: "Analyze the website functionality and suggest proper acceptance criteria that should be defined for this application."
  },
  {
    id: "xpath-generator",
    name: "XPath Generator",
    systemPrompt: "You are an expert in web automation and XPath generation. Create robust, maintainable XPath selectors for web elements. Always provide multiple XPath options including absolute, relative, and robust selectors. Format your response with clear XPath expressions that can be easily copied and used in automation frameworks.",
    userPromptTemplate: "Generate XPath selectors for the following HTML element(s):\n\n{content}\n\nProvide multiple XPath options:\n1. Absolute XPath\n2. Relative XPath using attributes\n3. Robust XPath using text or unique identifiers\n4. CSS selector equivalent (if applicable)\n\nFormat each selector clearly and explain the reliability of each approach.",
    fileProcessingPrompt: "Analyze the uploaded HTML/XML files and generate appropriate XPath selectors for the interactive elements found. Focus on buttons, inputs, links, and form elements.",
    urlProcessingPrompt: "Analyze the website structure at the provided URL and generate XPath selectors for key interactive elements like buttons, forms, links, and navigation elements. Prioritize elements that are commonly used in automation testing."
  },
  {
    id: "json-analyzer", 
    name: "JSON Analyzer",
    systemPrompt: "You are an expert in JSON structure analysis and validation. Analyze JSON data for structure, validity, performance implications, and potential issues.",
    userPromptTemplate: "Analyze the following JSON structure:\n\n{content}\n\nProvide insights on structure, validation, potential issues, and optimization suggestions.",
    fileProcessingPrompt: "Analyze the uploaded JSON files for structure validity, data consistency, and potential issues.",
    urlProcessingPrompt: "Analyze JSON API responses from the provided URL endpoint and provide structure analysis and validation feedback."
  },
  {
    id: "ada-analyzer",
    name: "ADA Analyzer", 
    systemPrompt: "You are an accessibility expert specializing in ADA compliance analysis. Evaluate web content for accessibility issues and provide remediation guidance.",
    userPromptTemplate: "Analyze the following content for ADA compliance:\n\n{content}\n\nIdentify accessibility issues and provide specific remediation steps.",
    fileProcessingPrompt: "Analyze uploaded files (HTML, CSS, images) for accessibility compliance issues and provide detailed remediation recommendations.",
    urlProcessingPrompt: "Perform a comprehensive ADA compliance analysis of the website at the provided URL. Check for WCAG 2.1 compliance issues including color contrast, keyboard navigation, screen reader compatibility, and semantic HTML structure."
  },
  {
    id: "lighthouse",
    name: "Lighthouse",
    systemPrompt: "You are a web performance and quality expert. Analyze websites for performance, accessibility, best practices, and SEO using Lighthouse methodology.",
    userPromptTemplate: "Perform a Lighthouse-style analysis on:\n\n{content}\n\nProvide performance metrics, accessibility scores, and optimization recommendations.",
    fileProcessingPrompt: "Analyze uploaded web files for performance optimization opportunities and best practices compliance.",
    urlProcessingPrompt: "Perform a comprehensive Lighthouse analysis of the website at the provided URL. Evaluate performance metrics (Core Web Vitals), accessibility, SEO, and best practices. Provide specific optimization recommendations."
  },
  {
    id: "chatbot",
    name: "QA Chatbot",
    systemPrompt: "You are an intelligent QA assistant with expertise in testing methodologies, automation frameworks, and quality assurance best practices. Provide helpful, accurate answers to QA-related questions.",
    userPromptTemplate: "QA Question: {content}\n\nProvide a comprehensive answer with practical examples and best practices.",
    fileProcessingPrompt: "Analyze the uploaded QA documentation or test files and answer questions or provide insights based on the content.",
    urlProcessingPrompt: "Analyze the website at the provided URL and answer QA-related questions about testing strategies, potential issues, or quality recommendations for this application."
  },
  {
    id: "defect-analyzer",
    name: "Defect Analyzer",
    systemPrompt: "You are an expert in defect analysis and root cause investigation. Analyze defects to identify patterns, root causes, and prevention strategies.",
    userPromptTemplate: "Analyze the following defect information:\n\n{content}\n\nProvide root cause analysis, impact assessment, and prevention recommendations.",
    fileProcessingPrompt: "Analyze uploaded defect reports, logs, or bug documentation to identify patterns and root causes.",
    jiraProcessingPrompt: "Analyze the defect reported in Jira story {title}:\n\nDescription: {description}\n\nProvide root cause analysis and prevention strategies.",
    urlProcessingPrompt: "Analyze the website for potential defect-prone areas and common issues that might occur in this type of application."
  },
  {
    id: "karate-script-writer",
    name: "Karate Script Writer",
    systemPrompt: "You are an expert in Karate API testing framework. Generate comprehensive Karate test scripts for API testing scenarios.",
    userPromptTemplate: "Generate Karate test scripts for:\n\n{content}\n\nInclude feature files with scenarios, background setup, and data validation.",
    fileProcessingPrompt: "Analyze uploaded API documentation or specifications and generate appropriate Karate test scripts.",
    jiraProcessingPrompt: "Generate Karate test scripts for the API requirements in Jira story {title}:\n\n{description}\n\nAcceptance Criteria: {acceptanceCriteria}",
    urlProcessingPrompt: "Analyze the API endpoints available at the provided URL and generate comprehensive Karate test scripts for testing these APIs."
  },
  {
    id: "smartspec-script-writer",
    name: "SmartSpec Script Writer",
    systemPrompt: "You are an expert in SmartSpec automation framework. Generate efficient SmartSpec automation scripts for web application testing.",
    userPromptTemplate: "Generate SmartSpec automation scripts for:\n\n{content}\n\nInclude page objects, test scenarios, and data management.",
    fileProcessingPrompt: "Analyze uploaded requirements or specifications and generate appropriate SmartSpec automation scripts.",
    jiraProcessingPrompt: "Generate SmartSpec automation scripts for Jira story {title}:\n\n{description}\n\nAcceptance Criteria: {acceptanceCriteria}",
    urlProcessingPrompt: "Analyze the web application at the provided URL and generate SmartSpec automation scripts for key user workflows and functionality testing."
  }
];

// Helper function to get tool prompt by ID
export const getToolPrompt = (toolId: string): ToolPrompt | undefined => {
  return toolPrompts.find(prompt => prompt.id === toolId);
};

// Helper function to get tool endpoint URL
export const getToolEndpointUrl = (toolId: string, config: EndpointConfig): string => {
  const endpoints: Record<string, string> = {
    'test-generator': config.testGeneratorEndpoint,
    'ac-validator': config.acValidatorEndpoint,
    'xpath-generator': config.xpathGeneratorEndpoint,
    'json-analyzer': config.jsonAnalyzerEndpoint,
    'ada-analyzer': config.adaAnalyzerEndpoint,
    'lighthouse': config.lighthouseEndpoint,
    'chatbot': config.chatbotEndpoint,
    'defect-analyzer': config.defectAnalyzerEndpoint,
    'karate-script-writer': config.karateScriptEndpoint,
    'smartspec-script-writer': config.smartspecScriptEndpoint,
    'jira-integration': config.jiraIntegrationEndpoint,
    'endpoints-monitor': config.endpointsMonitorEndpoint,
    'build-pipelines': config.buildPipelinesEndpoint,
    'sendmessage': config.sendMessageEndpoint
  };
  
  // Use monitoring base URL for monitoring-related endpoints
  const monitoringEndpoints = ['endpoints-monitor', 'build-pipelines'];
  const baseUrlToUse = monitoringEndpoints.includes(toolId) ? config.monitoringBaseUrl : config.baseUrl;
  
  return `${baseUrlToUse}${endpoints[toolId] || ''}`;
};

// Helper function to build complete prompt with context
export const buildPromptWithContext = (
  toolId: string,
  userInput?: string,
  jiraData?: any,
  urlData?: any,
  fileContext?: string[]
): string => {
  const toolPrompt = getToolPrompt(toolId);
  if (!toolPrompt) return "";

  let prompt = toolPrompt.systemPrompt + "\n\n";

  // Add Jira context if available
  if (jiraData && toolPrompt.jiraProcessingPrompt) {
    prompt += toolPrompt.jiraProcessingPrompt
      .replace("{title}", jiraData.title || "")
      .replace("{description}", jiraData.description || "")
      .replace("{acceptanceCriteria}", jiraData.acceptanceCriteria?.join("\n") || "");
  }

  // Add URL context if available  
  if (urlData && toolPrompt.urlProcessingPrompt) {
    prompt += "\n\n" + toolPrompt.urlProcessingPrompt;
  }

  // Add file context if available
  if (fileContext && fileContext.length > 0 && toolPrompt.fileProcessingPrompt) {
    prompt += "\n\n" + toolPrompt.fileProcessingPrompt;
    prompt += "\n\nFiles to analyze: " + fileContext.join(", ");
  }

  // Add user input if provided
  if (userInput) {
    prompt += "\n\n" + toolPrompt.userPromptTemplate.replace("{content}", userInput);
  }

  return prompt;
};

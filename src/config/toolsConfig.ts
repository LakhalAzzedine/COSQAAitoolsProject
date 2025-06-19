
import { 
  FileCheck, 
  CheckSquare, 
  MousePointer, 
  Code, 
  Accessibility, 
  Gauge, 
  Bug,
  FileCode,
  FileText
} from "lucide-react";

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  hasSpecialLayout: boolean;
  useJiraIntegration?: boolean;
  useUrlIntegration?: boolean;
  isChatbot?: boolean;
}

export const tools: Tool[] = [
  {
    id: "test-generator",
    name: "Test Generator",
    description: "Generate comprehensive test cases using AI",
    icon: FileCheck,
    color: "bg-blue-500",
    hasSpecialLayout: true,
    useJiraIntegration: true
  },
  {
    id: "ac-validator",
    name: "AC Validator",
    description: "Validate acceptance criteria completeness",
    icon: CheckSquare,
    color: "bg-green-500",
    hasSpecialLayout: true,
    useJiraIntegration: true
  },
  {
    id: "xpath-generator",
    name: "XPath Generator",
    description: "Create reliable XPath selectors",
    icon: MousePointer,
    color: "bg-purple-500",
    hasSpecialLayout: true,
    useUrlIntegration: true
  },
  {
    id: "json-analyzer",
    name: "JSON Analyzer",
    description: "Analyze and validate JSON structures",
    icon: Code,
    color: "bg-orange-500",
    hasSpecialLayout: true,
    useUrlIntegration: true
  },
  {
    id: "ada-analyzer",
    name: "ADA Analyzer",
    description: "Check accessibility compliance",
    icon: Accessibility,
    color: "bg-indigo-500",
    hasSpecialLayout: true,
    useUrlIntegration: true
  },
  {
    id: "lighthouse",
    name: "Lighthouse",
    description: "Performance and quality insights",
    icon: Gauge,
    color: "bg-yellow-500",
    hasSpecialLayout: true,
    useUrlIntegration: true
  },
  {
    id: "defect-analyzer",
    name: "Defect Analyzer",
    description: "Identify root causes of defects",
    icon: Bug,
    color: "bg-red-500",
    hasSpecialLayout: true,
    useJiraIntegration: true
  },
  {
    id: "karate-script-writer",
    name: "Karate Script Writer",
    description: "Generate Karate API test scripts",
    icon: FileCode,
    color: "bg-teal-500",
    hasSpecialLayout: true,
    useJiraIntegration: true
  },
  {
    id: "smartspec-script-writer",
    name: "SmartSpec Script Writer",
    description: "Generate SmartSpec automation scripts",
    icon: FileText,
    color: "bg-cyan-500",
    hasSpecialLayout: true,
    useJiraIntegration: true
  }
];

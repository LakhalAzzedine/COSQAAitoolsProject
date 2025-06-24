
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";

export function useKarateActions() {
  const [isCreatingJira, setIsCreatingJira] = useState(false);
  const { toast } = useToast();

  const createJiraTicket = async (generatedScripts: string, jiraData?: any) => {
    if (!generatedScripts) {
      toast({
        title: "Error",
        description: "Please generate Karate scripts first.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingJira(true);
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("jira-integration", config);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: "createTicket",
          scripts: generatedScripts,
          jiraId: jiraData?.id || jiraData?.key || '',
          toolId: "karate-script-writer"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast({
        title: "Jira Ticket Created",
        description: `Karate scripts ticket created in Jira: ${result.issueKey || 'Success'}`,
      });
      
    } catch (error) {
      console.error('Error creating Jira ticket:', error);
      toast({
        title: "Error",
        description: "Could not create ticket in Jira. Check configuration.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingJira(false);
    }
  };

  const exportScripts = (generatedScripts: string, jiraStoryId: string, jiraData: any, format: 'txt' | 'json') => {
    if (!generatedScripts) {
      toast({
        title: "Error",
        description: "Please generate Karate scripts first.",
        variant: "destructive",
      });
      return;
    }

    let content: string;
    let mimeType: string;
    let filename: string;

    if (format === 'json') {
      const exportData = {
        timestamp: new Date().toISOString(),
        jiraStoryId: jiraStoryId,
        generatedScripts: generatedScripts,
        jiraData: jiraData
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `karate-scripts-${Date.now()}.json`;
    } else {
      content = `Karate Scripts Generated on: ${new Date().toLocaleString()}\n\nJIRA Story ID: ${jiraStoryId}\n\nGenerated Karate Scripts:\n${generatedScripts}`;
      mimeType = 'text/plain';
      filename = `karate-scripts-${Date.now()}.feature`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Karate scripts exported as ${format === 'txt' ? 'FEATURE' : format.toUpperCase()} file`,
    });
  };

  return {
    isCreatingJira,
    createJiraTicket,
    exportScripts
  };
}

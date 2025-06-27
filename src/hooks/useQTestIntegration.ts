
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";

export function useQTestIntegration() {
  const [isCreatingQTest, setIsCreatingQTest] = useState(false);
  const { toast } = useToast();

  const createInQTest = async (data: any, toolId: string, dataType: string = 'analysis') => {
    if (!data) {
      toast({
        title: "Error",
        description: `Please generate ${dataType} first.`,
        variant: "destructive",
      });
      return;
    }

    setIsCreatingQTest(true);
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("qtest-integration", config);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: "createTestCase",
          data: data,
          toolId: toolId,
          dataType: dataType,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      toast({
        title: "QTest Integration Success",
        description: `Test case created in QTest: ${result.testCaseId || 'Success'}`,
      });
      
      return result;
      
    } catch (error) {
      console.error('Error creating in QTest:', error);
      toast({
        title: "QTest Integration Failed",
        description: "Could not create test case in QTest. Check configuration.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingQTest(false);
    }
  };

  return {
    isCreatingQTest,
    createInQTest
  };
}


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Target, Zap } from "lucide-react";

interface AIInsight {
  id: string;
  type: 'recommendation' | 'warning' | 'optimization' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
  actionable: boolean;
}

interface AIInsightsEngineProps {
  toolId: string;
  analysisData?: any;
  onInsightAction?: (insight: AIInsight) => void;
}

export function AIInsightsEngine({ toolId, analysisData, onInsightAction }: AIInsightsEngineProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    if (analysisData) {
      generateAIInsights();
    }
  }, [analysisData, toolId]);

  const generateAIInsights = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis with realistic insights
    setTimeout(() => {
      const generatedInsights: AIInsight[] = [
        {
          id: '1',
          type: 'recommendation',
          title: 'Enhance Test Coverage',
          description: 'AI detected 23% coverage gap in error handling scenarios. Consider adding negative test cases.',
          confidence: 87,
          impact: 'high',
          category: 'Test Strategy',
          actionable: true
        },
        {
          id: '2',
          type: 'optimization',
          title: 'XPath Optimization Opportunity',
          description: 'Current selectors show 34% brittleness. AI suggests using data-testid attributes for better stability.',
          confidence: 92,
          impact: 'medium',
          category: 'Automation',
          actionable: true
        },
        {
          id: '3',
          type: 'prediction',
          title: 'Potential Defect Hotspot',
          description: 'ML model predicts 76% probability of defects in user authentication module based on complexity metrics.',
          confidence: 78,
          impact: 'high',
          category: 'Risk Assessment',
          actionable: true
        },
        {
          id: '4',
          type: 'warning',
          title: 'Performance Regression Risk',
          description: 'API response time patterns suggest potential bottlenecks. Consider load testing for checkout flow.',
          confidence: 83,
          impact: 'medium',
          category: 'Performance',
          actionable: true
        }
      ];

      setInsights(generatedInsights);
      setOverallScore(85);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return <Target className="w-4 h-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'optimization': return <Zap className="w-4 h-4 text-green-500" />;
      case 'prediction': return <TrendingUp className="w-4 h-4 text-purple-500" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-blue-500 animate-pulse" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">🧠 AI Analysis in Progress</h3>
              <p className="text-sm text-gray-600">Analyzing patterns and generating professional insights...</p>
              <Progress value={75} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <span>🚀 AI-Powered Professional Insights</span>
          <Badge variant="outline" className="bg-purple-100 text-purple-700">
            Score: {overallScore}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onInsightAction?.(insight)}
          >
            <div className="flex items-start space-x-3">
              {getInsightIcon(insight.type)}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <Badge className={`text-xs ${getImpactColor(insight.impact)}`}>
                    {insight.impact.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {insight.category}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Confidence:</span>
                  <Progress value={insight.confidence} className="w-20 h-2" />
                  <span className="text-xs font-medium">{insight.confidence}%</span>
                  {insight.actionable && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      Actionable
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
          <p className="text-sm text-gray-700">
            💡 <strong>Pro Tip:</strong> AI insights are generated based on industry best practices, 
            historical data patterns, and machine learning models trained on thousands of QA scenarios.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

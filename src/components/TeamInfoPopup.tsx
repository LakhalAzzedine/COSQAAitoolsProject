
import { useState } from "react";
import { Brain, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TeamInfoPopup() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="w-full flex items-center justify-center px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent text-muted-foreground hover:text-foreground group"
          title="About the Team"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isHovered ? (
            <Sparkles className="w-4 h-4 flex-shrink-0 transition-all duration-200" strokeWidth={2.5} />
          ) : (
            <Brain className="w-4 h-4 flex-shrink-0 transition-all duration-200" strokeWidth={2.5} />
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span>Meet the QA AI Tools Team</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-lg text-center">🚀 Innovation Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700 text-center">
                We are a passionate team of QA engineers and AI specialists dedicated to revolutionizing 
                software testing through intelligent automation and cutting-edge AI technologies.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border">
                    <h4 className="font-semibold text-sm flex items-center space-x-2">
                      <span>👨‍💻</span>
                      <span>Lead QA Engineer</span>
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Architecting intelligent testing solutions
                    </p>
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg border">
                    <h4 className="font-semibold text-sm flex items-center space-x-2">
                      <span>🤖</span>
                      <span>AI Specialist</span>
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Building smart automation tools
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border">
                    <h4 className="font-semibold text-sm flex items-center space-x-2">
                      <span>🎨</span>
                      <span>UX Designer</span>
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Crafting intuitive user experiences
                    </p>
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg border">
                    <h4 className="font-semibold text-sm flex items-center space-x-2">
                      <span>⚡</span>
                      <span>DevOps Engineer</span>
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Ensuring seamless deployments
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">🎯 Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                To empower QA teams worldwide with AI-driven tools that enhance testing efficiency, 
                reduce manual effort, and improve software quality through intelligent automation 
                and comprehensive analysis capabilities.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">🛠️ Technologies We Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">React</Badge>
                <Badge variant="outline">TypeScript</Badge>
                <Badge variant="outline">AI/ML</Badge>
                <Badge variant="outline">Node.js</Badge>
                <Badge variant="outline">Python</Badge>
                <Badge variant="outline">Selenium</Badge>
                <Badge variant="outline">Karate</Badge>
                <Badge variant="outline">Jira API</Badge>
                <Badge variant="outline">REST APIs</Badge>
                <Badge variant="outline">Cloud Computing</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Built with ❤️ for the QA community • Version 2.0 • © 2024
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

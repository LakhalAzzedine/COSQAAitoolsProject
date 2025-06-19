
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  MessageCircle, 
  Video, 
  FileText, 
  ExternalLink,
  Mail,
  Phone
} from "lucide-react";

export function HelpSection() {
  const helpResources = [
    {
      title: "User Documentation",
      description: "Complete guide to using all QA tools and features",
      icon: BookOpen,
      type: "Documentation",
      action: "View Docs",
      color: "bg-blue-500"
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video guides for common workflows",
      icon: Video,
      type: "Tutorial",
      action: "Watch Videos",
      color: "bg-red-500"
    },
    {
      title: "API Reference",
      description: "Technical documentation for API integration",
      icon: FileText,
      type: "Reference",
      action: "View API Docs",
      color: "bg-green-500"
    },
    {
      title: "Live Chat Support",
      description: "Get instant help from our support team",
      icon: MessageCircle,
      type: "Support",
      action: "Start Chat",
      color: "bg-purple-500"
    }
  ];

  const faqItems = [
    {
      question: "How do I trigger a build pipeline?",
      answer: "Navigate to the Build Pipelines section, select your application, and click either 'Trigger QA Build' or 'Trigger PROD Build'."
    },
    {
      question: "What AI models power the QA tools?",
      answer: "Our QA tools use advanced language models specifically trained for quality assurance tasks, including test generation and defect analysis."
    },
    {
      question: "How often are endpoints monitored?",
      answer: "Endpoints are monitored every 30 seconds with real-time status updates displayed in the dashboard."
    },
    {
      question: "Can I customize the AI tool prompts?",
      answer: "Yes, you can customize prompts for each AI tool in the Settings section under 'AI Configuration'."
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
        <p className="text-muted-foreground">Find answers and get assistance with the QA platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {helpResources.map((resource, index) => {
          const Icon = resource.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${resource.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {resource.type}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-medium">{resource.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {resource.description}
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  <ExternalLink className="w-3 h-3 mr-2" />
                  {resource.action}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-border pb-4 last:border-b-0">
                <h3 className="font-medium text-sm mb-2">{item.question}</h3>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-12">
                <Mail className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Email Support</div>
                  <div className="text-xs text-muted-foreground">qa-support@company.com</div>
                </div>
              </Button>
              
              <Button variant="outline" className="w-full justify-start h-12">
                <Phone className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Phone Support</div>
                  <div className="text-xs text-muted-foreground">1-800-QA-HELP</div>
                </div>
              </Button>
              
              <Button variant="outline" className="w-full justify-start h-12">
                <MessageCircle className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Live Chat</div>
                  <div className="text-xs text-muted-foreground">Available 24/7</div>
                </div>
              </Button>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-sm mb-2">Quick Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Check the FAQ before contacting support</li>
                <li>• Include screenshots for visual issues</li>
                <li>• Mention your app version and browser</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

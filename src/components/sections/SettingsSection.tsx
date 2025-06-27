
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Shield, Palette, Brain } from "lucide-react";

export function SettingsSection() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">Settings</h1>
        <p className="text-muted-foreground dark:text-gray-400">Configure your QA platform preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
              <Palette className="w-5 h-5" />
              <span>Appearance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="dark:text-gray-200">Dark Mode</Label>
              <Switch id="dark-mode" />
            </div>
            
            <div className="space-y-2">
              <Label className="dark:text-gray-200">Theme Color</Label>
              <Select defaultValue="blue">
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="blue" className="dark:text-gray-200 dark:hover:bg-gray-700">Blue</SelectItem>
                  <SelectItem value="green" className="dark:text-gray-200 dark:hover:bg-gray-700">Green</SelectItem>
                  <SelectItem value="purple" className="dark:text-gray-200 dark:hover:bg-gray-700">Purple</SelectItem>
                  <SelectItem value="orange" className="dark:text-gray-200 dark:hover:bg-gray-700">Orange</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="animations" className="dark:text-gray-200">Enable Animations</Label>
              <Switch id="animations" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="dark:text-gray-200">Email Notifications</Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="build-alerts" className="dark:text-gray-200">Build Failure Alerts</Label>
              <Switch id="build-alerts" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="endpoint-alerts" className="dark:text-gray-200">Endpoint Down Alerts</Label>
              <Switch id="endpoint-alerts" defaultChecked />
            </div>

            <div className="space-y-2">
              <Label className="dark:text-gray-200">Alert Frequency</Label>
              <Select defaultValue="immediate">
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="immediate" className="dark:text-gray-200 dark:hover:bg-gray-700">Immediate</SelectItem>
                  <SelectItem value="hourly" className="dark:text-gray-200 dark:hover:bg-gray-700">Hourly Digest</SelectItem>
                  <SelectItem value="daily" className="dark:text-gray-200 dark:hover:bg-gray-700">Daily Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
              <Brain className="w-5 h-5" />
              <span>AI Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="dark:text-gray-200">AI Model</Label>
              <Select defaultValue="gpt-4">
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="gpt-4" className="dark:text-gray-200 dark:hover:bg-gray-700">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5" className="dark:text-gray-200 dark:hover:bg-gray-700">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude" className="dark:text-gray-200 dark:hover:bg-gray-700">Claude</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key" className="dark:text-gray-200">API Key</Label>
              <Input 
                id="api-key" 
                type="password" 
                placeholder="Enter your AI API key"
                className="font-mono dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="smart-suggestions" className="dark:text-gray-200">Smart Suggestions</Label>
              <Switch id="smart-suggestions" defaultChecked />
            </div>

            <Separator className="dark:bg-gray-700" />

            <Button variant="outline" className="w-full dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
              Test AI Connection
            </Button>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
              <Shield className="w-5 h-5" />
              <span>Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="two-factor" className="dark:text-gray-200">Two-Factor Authentication</Label>
              <Switch id="two-factor" />
            </div>
            
            <div className="space-y-2">
              <Label className="dark:text-gray-200">Session Timeout</Label>
              <Select defaultValue="8h">
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="1h" className="dark:text-gray-200 dark:hover:bg-gray-700">1 Hour</SelectItem>
                  <SelectItem value="4h" className="dark:text-gray-200 dark:hover:bg-gray-700">4 Hours</SelectItem>
                  <SelectItem value="8h" className="dark:text-gray-200 dark:hover:bg-gray-700">8 Hours</SelectItem>
                  <SelectItem value="24h" className="dark:text-gray-200 dark:hover:bg-gray-700">24 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="activity-logs" className="dark:text-gray-200">Activity Logging</Label>
              <Switch id="activity-logs" defaultChecked />
            </div>

            <Separator className="dark:bg-gray-700" />

            <div className="space-y-2">
              <Button variant="outline" className="w-full dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                Change Password
              </Button>
              <Button variant="outline" className="w-full dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                Download Activity Log
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-lg font-semibold dark:text-gray-100">v2.1.0</div>
              <div className="text-sm text-muted-foreground dark:text-gray-400">Platform Version</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold dark:text-gray-100">99.9%</div>
              <div className="text-sm text-muted-foreground dark:text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold dark:text-gray-100">156ms</div>
              <div className="text-sm text-muted-foreground dark:text-gray-400">Avg Response Time</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Activity } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";

interface Endpoint {
  id: string;
  name: string;
  url: string;
  status: "up" | "down" | "warning";
  responseTime: number;
  lastCheck: string;
  team: string;
}

interface EndpointDetailsModalProps {
  endpoint: Endpoint | null;
  isOpen: boolean;
  onClose: () => void;
}

const generateMockData = (status: string) => {
  const baseResponseTime = status === "up" ? 200 : status === "warning" ? 600 : 0;
  const variation = status === "up" ? 100 : status === "warning" ? 300 : 0;
  
  return Array.from({ length: 24 }, (_, i) => ({
    time: `${23 - i}h ago`,
    responseTime: status === "down" ? 0 : baseResponseTime + Math.random() * variation,
    uptime: status === "down" ? 0 : status === "warning" ? 75 + Math.random() * 20 : 95 + Math.random() * 5,
    requests: Math.floor(Math.random() * 1000) + 100
  })).reverse();
};

const chartConfig = {
  responseTime: {
    label: "Response Time",
    color: "hsl(var(--primary))"
  },
  uptime: {
    label: "Uptime",
    color: "hsl(142.1 76.2% 36.3%)"
  },
  requests: {
    label: "Requests",
    color: "hsl(221.2 83.2% 53.3%)"
  }
};

export function EndpointDetailsModal({ endpoint, isOpen, onClose }: EndpointDetailsModalProps) {
  if (!endpoint) return null;

  const mockData = generateMockData(endpoint.status);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "up":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "down":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      up: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      down: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const avgResponseTime = mockData.reduce((sum, item) => sum + item.responseTime, 0) / mockData.length;
  const avgUptime = mockData.reduce((sum, item) => sum + item.uptime, 0) / mockData.length;
  const totalRequests = mockData.reduce((sum, item) => sum + item.requests, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getStatusIcon(endpoint.status)}
            {endpoint.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Endpoint Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">URL</label>
                  <p className="text-sm break-all">{endpoint.url}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Team</label>
                  <p className="text-sm">{endpoint.team}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(endpoint.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Check</label>
                  <p className="text-sm">{endpoint.lastCheck}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgResponseTime > 0 ? `${Math.round(avgResponseTime)}ms` : "N/A"}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Uptime (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(avgUptime)}%
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalRequests.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Response Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Response Time (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <LineChart data={mockData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="var(--color-responseTime)" 
                    strokeWidth={2}
                    dot={{ fill: "var(--color-responseTime)" }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Uptime Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Uptime Percentage (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <AreaChart data={mockData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="uptime" 
                    stroke="var(--color-uptime)" 
                    fill="var(--color-uptime)" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Requests Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Volume (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={mockData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="requests" 
                    fill="var(--color-requests)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

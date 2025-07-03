import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Activity, CheckCircle, XCircle, Clock, Search, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EndpointDetailsModal } from "../EndpointDetailsModal";
import { defaultEndpointConfig, getToolEndpointUrl } from "@/config/backendConfig";

interface Endpoint {
  id: string;
  name: string;
  url: string;
  status: "up" | "down" | "warning";
  responseTime: number;
  lastCheck: string;
  team: string;
}

const CARDS_PER_PAGE = 8;
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export function EndpointsMonitor() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<string[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");
  const [connectionError, setConnectionError] = useState<string>("");
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const { toast } = useToast();

  const fetchEndpoints = async (showToast = true) => {
    setIsLoading(true);
    setConnectionError("");
    
    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      // Use the correct endpoint path for SVC cluster
      const endpointUrl = `${config.baseUrl}/endpoints`;
      console.log(`Fetching endpoints from: ${endpointUrl}`);
      
      const response = await fetch(endpointUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle structured JSON data - adapt based on actual payload structure
      const endpointsData: Endpoint[] = Array.isArray(data) ? data : (data.endpoints || []);
      
      const teamNames = endpointsData
        .map((endpoint: Endpoint) => endpoint.team)
        .filter((team: string): team is string => typeof team === 'string' && team.length > 0);
      const uniqueTeams: string[] = [...new Set(teamNames)];
      
      setTeams(uniqueTeams);
      setEndpoints(endpointsData);
      setLastUpdateTime(new Date().toLocaleTimeString());
      setConnectionError("");

      console.log('Successfully fetched endpoints:', endpointsData);
      
      if (showToast) {
        toast({
          title: "Data Refreshed",
          description: `Loaded ${endpointsData.length} endpoints successfully`,
        });
      }
    } catch (error) {
      console.error('Error fetching endpoints:', error);
      
      let errorMessage = "Unknown error occurred";
      if (error instanceof TypeError && error.message === "Load failed") {
        errorMessage = "CORS or Network Error - Cannot connect to SVC cluster. Please check if the backend is running and CORS is configured.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setConnectionError(errorMessage);
      setEndpoints([]);
      setTeams([]);
      
      if (showToast) {
        toast({
          title: "Connection Error",
          description: "Failed to fetch endpoints. Check console for details.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchEndpoints(false);
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchEndpoints(false);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesSearch = endpoint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         endpoint.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeam === "all" || endpoint.team === selectedTeam;
    const matchesStatus = statusFilter === "all" || endpoint.status === statusFilter;
    
    return matchesSearch && matchesTeam && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEndpoints.length / CARDS_PER_PAGE);
  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const paginatedEndpoints = filteredEndpoints.slice(startIndex, startIndex + CARDS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTeam, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "up":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "down":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
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

  const getStatusGlow = (status: string) => {
    switch (status) {
      case "up":
        return "shadow-lg shadow-green-500/20 border-green-200 dark:border-green-800";
      case "down":
        return "shadow-lg shadow-red-500/20 border-red-200 dark:border-red-800";
      case "warning":
        return "shadow-lg shadow-yellow-500/20 border-yellow-200 dark:border-yellow-800";
      default:
        return "shadow-lg shadow-gray-500/20";
    }
  };

  const getStatusCounts = () => {
    const filtered = filteredEndpoints;
    return {
      up: filtered.filter(e => e.status === "up").length,
      warning: filtered.filter(e => e.status === "warning").length,
      down: filtered.filter(e => e.status === "down").length
    };
  };

  const statusCounts = getStatusCounts();

  const handleCardClick = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEndpoint(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Endpoints Monitor</h1>
          <p className="text-muted-foreground">Real-time health monitoring for all endpoints across teams</p>
          {lastUpdateTime && (
            <p className="text-xs text-muted-foreground">Last updated: {lastUpdateTime}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)} 
            variant={autoRefreshEnabled ? "default" : "outline"}
            size="sm"
          >
            <Clock className={`w-4 h-4 mr-2 ${autoRefreshEnabled ? 'animate-pulse' : ''}`} />
            Auto-refresh {autoRefreshEnabled ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={() => fetchEndpoints(true)} disabled={isLoading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connectionError ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
            <span className="text-sm text-muted-foreground">
              {connectionError ? 'Disconnected' : 'Live Monitoring'}
            </span>
          </div>
        </div>
      </div>

      {/* Connection Error Alert */}
      {connectionError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center py-4">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <h4 className="font-medium text-red-900">Connection Error</h4>
              <p className="text-sm text-red-700">{connectionError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search endpoints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team} value={team}>{team}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="up">Up</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="down">Down</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Loading endpoints...</span>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!isLoading && endpoints.length === 0 && !connectionError && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Activity className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Endpoints Found</h3>
            <p className="text-muted-foreground text-center">
              No endpoint data available. Check your SVC cluster connection.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Endpoints Grid */}
      {!isLoading && paginatedEndpoints.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedEndpoints.map((endpoint) => (
            <Card 
              key={endpoint.id} 
              className={`hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 transform relative ${getStatusGlow(endpoint.status)}`}
              onClick={() => handleCardClick(endpoint)}
            >
              {/* Heartbeat indicator */}
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{endpoint.name}</CardTitle>
                  {getStatusIcon(endpoint.status)}
                </div>
                <div className="text-xs text-muted-foreground">{endpoint.team}</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground truncate">
                  {endpoint.url}
                </div>
                
                <div className="flex items-center justify-between">
                  {getStatusBadge(endpoint.status)}
                  <span className="text-xs text-muted-foreground">
                    {endpoint.responseTime > 0 ? `${endpoint.responseTime}ms` : "N/A"}
                  </span>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Last check: {endpoint.lastCheck}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* System Overview */}
      {!isLoading && endpoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{statusCounts.up}</div>
                <div className="text-sm text-muted-foreground">Healthy Endpoints</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{statusCounts.warning}</div>
                <div className="text-sm text-muted-foreground">Warning Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{statusCounts.down}</div>
                <div className="text-sm text-muted-foreground">Down Endpoints</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <EndpointDetailsModal 
        endpoint={selectedEndpoint}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}

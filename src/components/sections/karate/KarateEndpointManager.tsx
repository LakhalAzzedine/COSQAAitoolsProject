
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Globe, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiEndpoint {
  id: string;
  name: string;
  method: string;
  url: string;
  description: string;
  headers: Record<string, string>;
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
  requestBody?: string;
  expectedStatus: number;
  responseValidation?: string;
}

interface KarateEndpointManagerProps {
  endpoints: ApiEndpoint[];
  onEndpointsChange: (endpoints: ApiEndpoint[]) => void;
}

export function KarateEndpointManager({ endpoints, onEndpointsChange }: KarateEndpointManagerProps) {
  const [currentEndpoint, setCurrentEndpoint] = useState<ApiEndpoint>({
    id: '',
    name: '',
    method: 'GET',
    url: '',
    description: '',
    headers: {},
    pathParams: {},
    queryParams: {},
    expectedStatus: 200
  });
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
  const commonHeaders = ['Content-Type', 'Authorization', 'Accept', 'User-Agent', 'X-API-Key'];

  const addOrUpdateEndpoint = () => {
    if (!currentEndpoint.name || !currentEndpoint.url) {
      toast({
        title: "Validation Error",
        description: "Name and URL are required fields",
        variant: "destructive",
      });
      return;
    }

    const endpoint = {
      ...currentEndpoint,
      id: currentEndpoint.id || Date.now().toString()
    };

    if (isEditing) {
      onEndpointsChange(endpoints.map(ep => ep.id === endpoint.id ? endpoint : ep));
    } else {
      onEndpointsChange([...endpoints, endpoint]);
    }

    resetForm();
    toast({
      title: "Success",
      description: `Endpoint ${isEditing ? 'updated' : 'added'} successfully`,
    });
  };

  const editEndpoint = (endpoint: ApiEndpoint) => {
    setCurrentEndpoint(endpoint);
    setIsEditing(true);
  };

  const deleteEndpoint = (id: string) => {
    onEndpointsChange(endpoints.filter(ep => ep.id !== id));
    toast({
      title: "Deleted",
      description: "Endpoint removed successfully",
    });
  };

  const resetForm = () => {
    setCurrentEndpoint({
      id: '',
      name: '',
      method: 'GET',
      url: '',
      description: '',
      headers: {},
      pathParams: {},
      queryParams: {},
      expectedStatus: 200
    });
    setIsEditing(false);
  };

  const addKeyValuePair = (type: 'headers' | 'pathParams' | 'queryParams', key: string, value: string) => {
    if (!key.trim()) return;
    setCurrentEndpoint(prev => ({
      ...prev,
      [type]: { ...prev[type], [key]: value }
    }));
  };

  const removeKeyValuePair = (type: 'headers' | 'pathParams' | 'queryParams', key: string) => {
    setCurrentEndpoint(prev => {
      const updated = { ...prev[type] };
      delete updated[key];
      return { ...prev, [type]: updated };
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span>API Endpoint Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="endpoint-name">Endpoint Name</Label>
              <Input
                id="endpoint-name"
                placeholder="e.g., Get User Profile"
                value={currentEndpoint.name}
                onChange={(e) => setCurrentEndpoint(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="http-method">HTTP Method</Label>
              <Select value={currentEndpoint.method} onValueChange={(value) => setCurrentEndpoint(prev => ({ ...prev, method: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {httpMethods.map(method => (
                    <SelectItem key={method} value={method}>
                      <Badge variant={method === 'GET' ? 'secondary' : method === 'POST' ? 'default' : 'outline'}>
                        {method}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="endpoint-url">URL</Label>
            <Input
              id="endpoint-url"
              placeholder="https://api.example.com/users/{id}"
              value={currentEndpoint.url}
              onChange={(e) => setCurrentEndpoint(prev => ({ ...prev, url: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="endpoint-description">Description</Label>
            <Textarea
              id="endpoint-description"
              placeholder="Describe what this endpoint does..."
              value={currentEndpoint.description}
              onChange={(e) => setCurrentEndpoint(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Expected Status Code</Label>
              <Input
                type="number"
                value={currentEndpoint.expectedStatus}
                onChange={(e) => setCurrentEndpoint(prev => ({ ...prev, expectedStatus: parseInt(e.target.value) || 200 }))}
              />
            </div>
          </div>

          {currentEndpoint.method !== 'GET' && (
            <div>
              <Label htmlFor="request-body">Request Body (JSON)</Label>
              <Textarea
                id="request-body"
                placeholder='{"key": "value"}'
                value={currentEndpoint.requestBody || ''}
                onChange={(e) => setCurrentEndpoint(prev => ({ ...prev, requestBody: e.target.value }))}
                rows={4}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={addOrUpdateEndpoint} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              {isEditing ? 'Update Endpoint' : 'Add Endpoint'}
            </Button>
            {isEditing && (
              <Button onClick={resetForm} variant="outline">
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {endpoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-green-600" />
              <span>Configured Endpoints ({endpoints.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {endpoints.map((endpoint) => (
                <div key={endpoint.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                        {endpoint.method}
                      </Badge>
                      <span className="font-medium">{endpoint.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{endpoint.url}</p>
                    {endpoint.description && (
                      <p className="text-xs text-muted-foreground mt-1">{endpoint.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editEndpoint(endpoint)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEndpoint(endpoint.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

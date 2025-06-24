
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Copy, BookOpen, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KarateTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
  tags: string[];
}

interface KarateTemplateLibraryProps {
  onTemplateSelect: (template: KarateTemplate) => void;
}

export function KarateTemplateLibrary({ onTemplateSelect }: KarateTemplateLibraryProps) {
  const { toast } = useToast();

  const templates: KarateTemplate[] = [
    {
      id: 'basic-get',
      name: 'Basic GET Request',
      category: 'Basic',
      description: 'Simple GET request with response validation',
      tags: ['GET', 'validation', 'basic'],
      code: `Feature: Basic GET Request

Background:
  * url 'https://api.example.com'

Scenario: Get user by ID
  Given path 'users', 1
  When method GET
  Then status 200
  And match response == { id: 1, name: '#string', email: '#string' }
  And match response.id == 1`
    },
    {
      id: 'post-json',
      name: 'POST with JSON Body',
      category: 'Basic',
      description: 'POST request with JSON payload and validation',
      tags: ['POST', 'JSON', 'create'],
      code: `Feature: Create User

Background:
  * url 'https://api.example.com'
  * header Content-Type = 'application/json'

Scenario: Create new user
  Given path 'users'
  And request { name: 'John Doe', email: 'john@example.com' }
  When method POST
  Then status 201
  And match response.id == '#number'
  And match response.name == 'John Doe'
  And match response.email == 'john@example.com'`
    },
    {
      id: 'auth-bearer',
      name: 'Authentication with Bearer Token',
      category: 'Authentication',
      description: 'Request with Bearer token authentication',
      tags: ['auth', 'bearer', 'token'],
      code: `Feature: Authenticated Request

Background:
  * url 'https://api.example.com'
  * def authToken = 'your-jwt-token-here'
  * header Authorization = 'Bearer ' + authToken

Scenario: Get protected resource
  Given path 'protected-resource'
  When method GET
  Then status 200
  And match response.message == 'Access granted'`
    },
    {
      id: 'data-driven',
      name: 'Data-Driven Testing',
      category: 'Advanced',
      description: 'Parameterized test with multiple data sets',
      tags: ['data-driven', 'examples', 'parameterized'],
      code: `Feature: Data-Driven User Creation

Background:
  * url 'https://api.example.com'
  * header Content-Type = 'application/json'

Scenario Outline: Create users with different data
  Given path 'users'
  And request { name: '<name>', email: '<email>', role: '<role>' }
  When method POST
  Then status 201
  And match response.name == '<name>'
  And match response.role == '<role>'

Examples:
| name       | email              | role    |
| John Doe   | john@example.com   | user    |
| Jane Admin | jane@example.com   | admin   |
| Bob Test   | bob@example.com    | tester  |`
    },
    {
      id: 'response-validation',
      name: 'Advanced Response Validation',
      category: 'Validation',
      description: 'Comprehensive response validation patterns',
      tags: ['validation', 'schema', 'response'],
      code: `Feature: Advanced Response Validation

Background:
  * url 'https://api.example.com'

Scenario: Validate complex response structure
  Given path 'users', 1, 'profile'
  When method GET
  Then status 200
  
  # Validate response structure
  And match response ==
  """
  {
    id: '#number',
    name: '#string',
    email: '#regex [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    profile: {
      avatar: '#string',
      bio: '#string',
      created_at: '#string',
      preferences: {
        theme: '#regex (light|dark)',
        notifications: '#boolean'
      }
    },
    roles: '#[] #string'
  }
  """
  
  # Additional validations
  And assert response.roles.length > 0
  And match each response.roles == '#string'`
    },
    {
      id: 'error-handling',
      name: 'Error Handling & Status Codes',
      category: 'Error Handling',
      description: 'Testing various error scenarios and status codes',
      tags: ['error', 'status', 'negative'],
      code: `Feature: Error Handling

Background:
  * url 'https://api.example.com'

Scenario: Handle 404 Not Found
  Given path 'users', 99999
  When method GET
  Then status 404
  And match response.error == 'User not found'
  And match response.code == 'USER_NOT_FOUND'

Scenario: Handle 400 Bad Request
  Given path 'users'
  And request { name: '', email: 'invalid-email' }
  When method POST
  Then status 400
  And match response.errors contains 'Name is required'
  And match response.errors contains 'Invalid email format'

Scenario: Handle 401 Unauthorized
  Given path 'protected-resource'
  When method GET
  Then status 401
  And match response.error == 'Unauthorized access'`
    },
    {
      id: 'performance-test',
      name: 'Performance & Load Testing',
      category: 'Performance',
      description: 'Basic performance testing setup',
      tags: ['performance', 'load', 'timing'],
      code: `Feature: Performance Testing

Background:
  * url 'https://api.example.com'
  * configure retry = { count: 3, interval: 1000 }

Scenario: Response time validation
  Given path 'users'
  When method GET
  Then status 200
  And assert responseTime < 1000
  
Scenario: Concurrent requests simulation
  * def results = []
  * def addResult = function(x){ results.add(x) }
  
  # Simulate 5 concurrent requests
  * def futures = []
  * futures[0] = karate.fork('classpath:get-user.feature')
  * futures[1] = karate.fork('classpath:get-user.feature')
  * futures[2] = karate.fork('classpath:get-user.feature')
  * futures[3] = karate.fork('classpath:get-user.feature')
  * futures[4] = karate.fork('classpath:get-user.feature')
  
  * karate.await(futures[0])
  * karate.await(futures[1])
  * karate.await(futures[2])
  * karate.await(futures[3])
  * karate.await(futures[4])`
    }
  ];

  const categories = [...new Set(templates.map(t => t.category))];

  const copyToClipboard = (code: string, templateName: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied to Clipboard",
      description: `${templateName} template copied successfully`,
    });
  };

  const useTemplate = (template: KarateTemplate) => {
    onTemplateSelect(template);
    toast({
      title: "Template Applied",
      description: `${template.name} template has been loaded`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          <span>Karate Template Library</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={categories[0]} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {categories.map(category => (
            <TabsContent key={category} value={category} className="space-y-3">
              {templates
                .filter(template => template.category === category)
                .map(template => (
                  <div key={template.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{template.name}</h4>
                          <div className="flex space-x-1">
                            {template.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      <div className="flex space-x-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(template.code, template.name)}
                          title="Copy to clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => useTemplate(template)}
                        >
                          <Zap className="w-4 h-4 mr-1" />
                          Use
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded text-sm">
                      <pre className="whitespace-pre-wrap overflow-x-auto">
                        <code>{template.code}</code>
                      </pre>
                    </div>
                  </div>
                ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

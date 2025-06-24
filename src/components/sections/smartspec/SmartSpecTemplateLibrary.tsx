
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Copy, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SmartSpecTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  template: string;
  tags: string[];
}

interface SmartSpecTemplateLibraryProps {
  onTemplateSelect: (template: string) => void;
}

export function SmartSpecTemplateLibrary({ onTemplateSelect }: SmartSpecTemplateLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const { toast } = useToast();

  const templates: SmartSpecTemplate[] = [
    {
      id: "login-flow",
      name: "User Login Flow",
      category: "authentication",
      description: "Complete user login scenario with validation",
      tags: ["login", "authentication", "form"],
      template: `Feature: User Login
  As a user
  I want to log into the application
  So that I can access my account

  Background:
    Given I am on the login page

  Scenario: Successful login with valid credentials
    When I enter valid username "user@example.com"
    And I enter valid password "password123"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see a welcome message

  Scenario: Failed login with invalid credentials
    When I enter invalid username "invalid@example.com"
    And I enter invalid password "wrongpassword"
    And I click the login button
    Then I should see an error message "Invalid credentials"
    And I should remain on the login page

  Scenario: Login form validation
    When I click the login button without entering credentials
    Then I should see validation errors for required fields`
    },
    {
      id: "form-submission",
      name: "Form Submission",
      category: "forms",
      description: "Generic form submission with validation scenarios",
      tags: ["form", "validation", "submit"],
      template: `Feature: Form Submission
  As a user
  I want to submit a form
  So that I can save my information

  Scenario: Successful form submission
    Given I am on the form page
    When I fill in all required fields with valid data
    And I click the submit button
    Then the form should be submitted successfully
    And I should see a success message

  Scenario: Form validation for required fields
    Given I am on the form page
    When I submit the form without filling required fields
    Then I should see validation errors for each required field
    And the form should not be submitted

  Scenario: Form validation for invalid data formats
    Given I am on the form page
    When I enter invalid email format in email field
    And I submit the form
    Then I should see an email format validation error`
    },
    {
      id: "navigation-menu",
      name: "Navigation Menu",
      category: "navigation",
      description: "Menu navigation and routing scenarios",
      tags: ["navigation", "menu", "routing"],
      template: `Feature: Navigation Menu
  As a user
  I want to navigate through the application
  So that I can access different sections

  Scenario: Main menu navigation
    Given I am on the home page
    When I click on the "Products" menu item
    Then I should be navigated to the products page
    And the "Products" menu item should be highlighted

  Scenario: Submenu navigation
    Given I am on any page
    When I hover over the "Services" menu item
    Then I should see the services submenu
    When I click on "Support" in the submenu
    Then I should be navigated to the support page

  Scenario: Mobile menu functionality
    Given I am viewing the site on a mobile device
    When I click the hamburger menu icon
    Then the mobile menu should expand
    And all menu items should be visible`
    },
    {
      id: "search-functionality",
      name: "Search Functionality",
      category: "search",
      description: "Search feature with filters and results",
      tags: ["search", "filter", "results"],
      template: `Feature: Search Functionality
  As a user
  I want to search for content
  So that I can find relevant information

  Scenario: Basic search with results
    Given I am on the search page
    When I enter "laptop" in the search box
    And I click the search button
    Then I should see search results containing "laptop"
    And the results should be displayed in a list format

  Scenario: Search with no results
    Given I am on the search page
    When I enter "nonexistentitem123" in the search box
    And I click the search button
    Then I should see a "No results found" message
    And I should see suggestions for refining my search

  Scenario: Search with filters
    Given I am on the search page
    When I enter "phone" in the search box
    And I select "Electronics" from the category filter
    And I click the search button
    Then I should see filtered results for phones in electronics category`
    },
    {
      id: "data-table",
      name: "Data Table Operations",
      category: "tables",
      description: "Table sorting, filtering, and pagination",
      tags: ["table", "sorting", "pagination", "filter"],
      template: `Feature: Data Table Operations
  As a user
  I want to interact with data tables
  So that I can organize and view information effectively

  Scenario: Table sorting functionality
    Given I am viewing a data table with multiple rows
    When I click on the "Name" column header
    Then the table should be sorted by name in ascending order
    When I click on the "Name" column header again
    Then the table should be sorted by name in descending order

  Scenario: Table pagination
    Given I am viewing a data table with more than 10 rows
    When I navigate to page 2 using pagination controls
    Then I should see the next set of table rows
    And the pagination should show page 2 as active

  Scenario: Table row selection
    Given I am viewing a data table
    When I select multiple table rows using checkboxes
    Then the selected rows should be highlighted
    And bulk action buttons should become available`
    },
    {
      id: "modal-dialog",
      name: "Modal Dialog Interactions",
      category: "dialogs",
      description: "Modal dialog opening, closing, and form interactions",
      tags: ["modal", "dialog", "popup"],
      template: `Feature: Modal Dialog Interactions
  As a user
  I want to interact with modal dialogs
  So that I can perform focused actions

  Scenario: Opening and closing modal
    Given I am on the main page
    When I click the "Add New Item" button
    Then a modal dialog should open
    And the modal should have a title "Add New Item"
    When I click the close button
    Then the modal should close

  Scenario: Modal form submission
    Given I have opened the "Add New Item" modal
    When I fill in the required fields
    And I click the "Save" button
    Then the item should be created
    And the modal should close
    And I should see a success notification

  Scenario: Modal backdrop click
    Given I have opened a modal dialog
    When I click outside the modal (on the backdrop)
    Then the modal should close`
    }
  ];

  const categories = ["all", ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = selectedCategory === "all" 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const copyToClipboard = (template: string, name: string) => {
    navigator.clipboard.writeText(template);
    toast({
      title: "Template Copied",
      description: `${name} template has been copied to clipboard`,
    });
  };

  const toggleExpanded = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-purple-600" />
          <span>SmartSpec Template Library</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(template.id)}
                    title={expandedTemplate === template.id ? "Hide template" : "Show template"}
                  >
                    {expandedTemplate === template.id ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(template.template, template.name)}
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTemplateSelect(template.template)}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
              
              {expandedTemplate === template.id && (
                <div className="mt-2">
                  <Textarea
                    value={template.template}
                    readOnly
                    className="min-h-48 text-sm font-mono bg-muted"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

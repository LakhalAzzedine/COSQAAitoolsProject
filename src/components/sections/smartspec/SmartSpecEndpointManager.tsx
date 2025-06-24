
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Monitor, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UIElement {
  id: string;
  name: string;
  selector: string;
  selectorType: string;
  page: string;
  description: string;
  elementType: string;
  expectedBehavior: string;
}

interface SmartSpecEndpointManagerProps {
  elements: UIElement[];
  onElementsChange: (elements: UIElement[]) => void;
}

export function SmartSpecEndpointManager({ elements, onElementsChange }: SmartSpecEndpointManagerProps) {
  const [currentElement, setCurrentElement] = useState<UIElement>({
    id: '',
    name: '',
    selector: '',
    selectorType: 'id',
    page: '',
    description: '',
    elementType: 'button',
    expectedBehavior: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const selectorTypes = ['id', 'class', 'xpath', 'css', 'name', 'tag', 'linkText', 'partialLinkText'];
  const elementTypes = ['button', 'input', 'select', 'checkbox', 'radio', 'link', 'text', 'image', 'form', 'table', 'div'];

  const addOrUpdateElement = () => {
    if (!currentElement.name || !currentElement.selector || !currentElement.page) {
      toast({
        title: "Validation Error",
        description: "Name, selector, and page are required fields",
        variant: "destructive",
      });
      return;
    }

    const element = {
      ...currentElement,
      id: currentElement.id || Date.now().toString()
    };

    if (isEditing) {
      onElementsChange(elements.map(el => el.id === element.id ? element : el));
    } else {
      onElementsChange([...elements, element]);
    }

    resetForm();
    toast({
      title: "Success",
      description: `UI Element ${isEditing ? 'updated' : 'added'} successfully`,
    });
  };

  const editElement = (element: UIElement) => {
    setCurrentElement(element);
    setIsEditing(true);
  };

  const deleteElement = (id: string) => {
    onElementsChange(elements.filter(el => el.id !== id));
    toast({
      title: "Deleted",
      description: "UI Element removed successfully",
    });
  };

  const resetForm = () => {
    setCurrentElement({
      id: '',
      name: '',
      selector: '',
      selectorType: 'id',
      page: '',
      description: '',
      elementType: 'button',
      expectedBehavior: ''
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="w-5 h-5 text-blue-600" />
            <span>UI Element Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="element-name">Element Name</Label>
              <Input
                id="element-name"
                placeholder="e.g., Login Button"
                value={currentElement.name}
                onChange={(e) => setCurrentElement(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="page-name">Page</Label>
              <Input
                id="page-name"
                placeholder="e.g., Login Page"
                value={currentElement.page}
                onChange={(e) => setCurrentElement(prev => ({ ...prev, page: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="element-type">Element Type</Label>
              <Select value={currentElement.elementType} onValueChange={(value) => setCurrentElement(prev => ({ ...prev, elementType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {elementTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      <Badge variant="outline">{type}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="selector-type">Selector Type</Label>
              <Select value={currentElement.selectorType} onValueChange={(value) => setCurrentElement(prev => ({ ...prev, selectorType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectorTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      <Badge variant={type === 'id' ? 'default' : type === 'xpath' ? 'secondary' : 'outline'}>
                        {type}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="element-selector">Selector</Label>
            <Input
              id="element-selector"
              placeholder="e.g., #login-btn or //button[@id='login']"
              value={currentElement.selector}
              onChange={(e) => setCurrentElement(prev => ({ ...prev, selector: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="element-description">Description</Label>
            <Textarea
              id="element-description"
              placeholder="Describe the element and its purpose..."
              value={currentElement.description}
              onChange={(e) => setCurrentElement(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="expected-behavior">Expected Behavior</Label>
            <Textarea
              id="expected-behavior"
              placeholder="Describe what should happen when interacting with this element..."
              value={currentElement.expectedBehavior}
              onChange={(e) => setCurrentElement(prev => ({ ...prev, expectedBehavior: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={addOrUpdateElement} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              {isEditing ? 'Update Element' : 'Add Element'}
            </Button>
            {isEditing && (
              <Button onClick={resetForm} variant="outline">
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {elements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-green-600" />
              <span>Configured UI Elements ({elements.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {elements.map((element) => (
                <div key={element.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="default">{element.elementType}</Badge>
                      <Badge variant="outline">{element.selectorType}</Badge>
                      <span className="font-medium">{element.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Page: {element.page}</p>
                    <p className="text-xs text-muted-foreground">{element.selector}</p>
                    {element.description && (
                      <p className="text-xs text-muted-foreground mt-1">{element.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editElement(element)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteElement(element.id)}
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

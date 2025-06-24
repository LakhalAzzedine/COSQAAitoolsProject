
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KarateFileManagerProps {
  importedFiles: File[];
  onFilesChange: (files: File[]) => void;
}

export function KarateFileManager({ importedFiles, onFilesChange }: KarateFileManagerProps) {
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    onFilesChange([...importedFiles, ...files]);
    
    toast({
      title: "Files Added",
      description: `${files.length} file(s) added for processing`,
    });
  };

  const removeFile = (index: number) => {
    onFilesChange(importedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="file-upload">Import Files (Optional)</Label>
      <Input
        id="file-upload"
        type="file"
        multiple
        accept=".txt,.md,.json,.xml,.feature,.java,.js,.ts,.pdf,.docx,.xlsx"
        onChange={handleFileUpload}
        className="cursor-pointer"
      />
      
      {importedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Imported Files:</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {importedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

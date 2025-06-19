
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileImportProps {
  onFilesImported: (files: File[]) => void;
}

export function FileImport({ onFilesImported }: FileImportProps) {
  const [importedFiles, setImportedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImportedFiles(prev => [...prev, ...files]);
    onFilesImported(files);
    
    toast({
      title: "Files Imported",
      description: `${files.length} file(s) imported successfully`,
    });
  };

  const removeFile = (index: number) => {
    setImportedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Import Files</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="file"
            multiple
            accept=".txt,.md,.json,.xml,.feature,.java,.js,.ts"
            onChange={handleFileUpload}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Supported: .txt, .md, .json, .xml, .feature, .java, .js, .ts
          </p>
        </div>

        {importedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Imported Files:</h4>
            {importedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
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
        )}
      </CardContent>
    </Card>
  );
}


import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCode, Download, FileText, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface KarateScriptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generatedScripts: string;
  jiraStoryId: string;
  isCreatingJira: boolean;
  onExportScripts: (format: 'txt' | 'json') => void;
  onCreateJiraTicket: () => void;
}

export function KarateScriptModal({
  open,
  onOpenChange,
  generatedScripts,
  jiraStoryId,
  isCreatingJira,
  onExportScripts,
  onCreateJiraTicket
}: KarateScriptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-teal-600" />
            <span>Generated Karate Scripts</span>
            {jiraStoryId && (
              <Badge variant="secondary">JIRA: {jiraStoryId}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Review the AI-generated Karate API test scripts below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">{generatedScripts}</pre>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button onClick={() => onExportScripts('txt')} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Feature
            </Button>
            <Button onClick={() => onExportScripts('json')} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button 
              onClick={onCreateJiraTicket}
              disabled={isCreatingJira}
              variant="outline"
            >
              {isCreatingJira ? (
                <Send className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {isCreatingJira ? "Creating..." : "Create in Jira"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InfoPopoverProps {
  title: string;
  content: string;
  steps?: string[];
}

export function InfoPopover({ title, content, steps }: InfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full hover:bg-blue-100"
        >
          <Info className="h-4 w-4 text-blue-600" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-gray-600 mb-3">{content}</p>
            {steps && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700">How to use:</p>
                <ol className="list-decimal list-inside space-y-1">
                  {steps.map((step, index) => (
                    <li key={index} className="text-xs text-gray-600">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

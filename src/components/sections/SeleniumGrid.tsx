import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid3X3, ExternalLink, Camera, Video, VideoOff, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SeleniumGridProps {
  gridType: "qa" | "prod";
}

interface TestSession {
  id: string;
  name: string;
  browser: string;
  status: "running" | "idle";
  nodeId?: string;
  capabilities?: any;
}

export function SeleniumGrid({ gridType }: SeleniumGridProps) {
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTakingScreenshot, setIsTakingScreenshot] = useState(false);
  const [testSessions, setTestSessions] = useState<TestSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const { toast } = useToast();

  const getGridConfig = () => {
    switch (gridType) {
      case "qa":
        return {
          title: "Selenium QA Grid",
          description: "QA Environment Selenium Grid Console",
          url: "http://localhost:4444/ui", // Default Selenium Grid Hub URL
          apiUrl: "http://localhost:4444", // Grid API base URL
          badge: "QA",
          badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
        };
      case "prod":
        return {
          title: "Selenium PROD Grid",
          description: "Production Environment Selenium Grid Console",
          url: "http://prod-selenium-grid:4444/ui", // Replace with your prod URL
          apiUrl: "http://prod-selenium-grid:4444", // Replace with your prod API URL
          badge: "PROD",
          badgeColor: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
        };
    }
  };

  const config = getGridConfig();

  // Fetch test sessions from Selenium Grid
  const fetchTestSessions = async () => {
    setIsLoadingSessions(true);
    try {
      console.log(`Fetching test sessions from: ${config.apiUrl}/status`);
      
      const response = await fetch(`${config.apiUrl}/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const gridStatus = await response.json();
      console.log('Grid status response:', gridStatus);
      
      // Parse sessions from grid status
      const sessions: TestSession[] = [];
      
      if (gridStatus.value && gridStatus.value.nodes) {
        gridStatus.value.nodes.forEach((node: any, nodeIndex: number) => {
          if (node.slots) {
            node.slots.forEach((slot: any, slotIndex: number) => {
              if (slot.session) {
                const session = slot.session;
                sessions.push({
                  id: session.sessionId || `node-${nodeIndex}-slot-${slotIndex}`,
                  name: `${session.capabilities?.browserName || 'Unknown'} - ${session.capabilities?.platformName || 'Unknown'}`,
                  browser: session.capabilities?.browserName || 'Unknown',
                  status: 'running',
                  nodeId: node.id,
                  capabilities: session.capabilities
                });
              }
            });
          }
        });
      }
      
      setTestSessions(sessions);
      console.log('Parsed test sessions:', sessions);
      
      if (sessions.length === 0) {
        toast({
          title: "ℹ️ No Active Sessions",
          description: "No active test sessions found on the grid",
        });
      }
      
    } catch (error) {
      console.error('Error fetching test sessions:', error);
      toast({
        title: "❌ Failed to Fetch Sessions",
        description: "Could not retrieve test sessions from the grid",
        variant: "destructive",
      });
      
      // Fallback to mock data for development
      setTestSessions([
        { id: "session-1", name: "Login Test - Chrome", browser: "Chrome", status: "running" },
        { id: "session-2", name: "Checkout Flow - Firefox", browser: "Firefox", status: "running" },
        { id: "session-3", name: "Dashboard Test - Edge", browser: "Edge", status: "idle" },
      ]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Load sessions on component mount
  useEffect(() => {
    fetchTestSessions();
  }, [gridType]);

  // Download blob as file
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const takeScreenshot = async () => {
    if (!selectedTest) {
      toast({
        title: "❌ Test Not Selected",
        description: "Please select a test session first",
        variant: "destructive",
      });
      return;
    }

    setIsTakingScreenshot(true);
    
    try {
      // Get the selected session details
      const session = testSessions.find(s => s.id === selectedTest);
      
      // Try to capture screenshot from Selenium Grid first
      try {
        const response = await fetch(`${config.apiUrl}/session/${selectedTest}/screenshot`);
        if (response.ok) {
          const blob = await response.blob();
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `selenium-screenshot-${session?.browser || 'unknown'}-${timestamp}.png`;
          
          downloadBlob(blob, filename);
          
          toast({
            title: "📸 Screenshot Captured",
            description: `Screenshot saved as ${filename}`,
          });
          return;
        }
      } catch (gridError) {
        console.log('Grid screenshot failed, falling back to screen capture');
      }
      
      // Fallback to screen capture if grid screenshot fails
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      await new Promise(resolve => {
        video.addEventListener('loadedmetadata', resolve);
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      stream.getTracks().forEach(track => track.stop());
      
      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `screenshot-${session?.browser || selectedTest}-${timestamp}.png`;
          downloadBlob(blob, filename);
          
          toast({
            title: "📸 Screenshot Captured",
            description: `Screenshot saved as ${filename}`,
          });
        }
      }, 'image/png');

      console.log(`Screenshot taken for test: ${selectedTest}`);
      
    } catch (error) {
      console.error('Error taking screenshot:', error);
      toast({
        title: "❌ Screenshot Failed",
        description: "Could not capture screenshot. Please allow screen sharing.",
        variant: "destructive",
      });
    } finally {
      setIsTakingScreenshot(false);
    }
  };

  const toggleRecording = async () => {
    if (!selectedTest) {
      toast({
        title: "❌ Test Not Selected",
        description: "Please select a test session first",
        variant: "destructive",
      });
      return;
    }

    if (isRecording && mediaRecorder) {
      // Stop recording
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      
      toast({
        title: "🎥 Recording Stopped",
        description: "Processing and saving the recording...",
      });

      console.log(`Recording stopped for test: ${selectedTest}`);
      
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: true 
        });
        
        const recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9'
        });
        
        const chunks: Blob[] = [];
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const session = testSessions.find(s => s.id === selectedTest);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `recording-${session?.browser || selectedTest}-${timestamp}.webm`;
          
          downloadBlob(blob, filename);
          
          toast({
            title: "🎥 Recording Saved",
            description: `Recording saved as ${filename}`,
          });
          
          stream.getTracks().forEach(track => track.stop());
        };
        
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        
        toast({
          title: "🎥 Recording Started",
          description: "Screen recording is now active",
        });

        console.log(`Recording started for test: ${selectedTest}`);
        
      } catch (error) {
        console.error('Error starting recording:', error);
        toast({
          title: "❌ Recording Start Failed",
          description: "Could not start recording. Please allow screen sharing.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Grid3X3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
            <p className="text-muted-foreground">{config.description}</p>
          </div>
        </div>
        <Badge className={config.badgeColor}>
          {config.badge}
        </Badge>
      </div>

      {/* Test Selection and Capture Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Test Session Control</span>
            <Button
              onClick={fetchTestSessions}
              disabled={isLoadingSessions}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingSessions ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Select Test Session</label>
            <Select value={selectedTest} onValueChange={setSelectedTest}>
              <SelectTrigger>
                <SelectValue placeholder={
                  isLoadingSessions 
                    ? "Loading sessions..." 
                    : testSessions.length === 0 
                      ? "No active sessions found" 
                      : "Choose a test session to monitor"
                } />
              </SelectTrigger>
              <SelectContent>
                {testSessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        session.status === 'running' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span>{session.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {session.browser}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTest && (
            <div className="flex space-x-3 pt-4 border-t">
              <Button
                onClick={takeScreenshot}
                disabled={isTakingScreenshot || !selectedTest}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>{isTakingScreenshot ? 'Taking Screenshot...' : 'Take Screenshot'}</span>
              </Button>

              <Button
                onClick={toggleRecording}
                disabled={!selectedTest}
                variant={isRecording ? "destructive" : "default"}
                className="flex items-center space-x-2"
              >
                {isRecording ? (
                  <>
                    <VideoOff className="w-4 h-4" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    <span>Start Recording</span>
                  </>
                )}
              </Button>

              {isRecording && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Recording Active</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Grid Console</span>
            {config.url && (
              <a 
                href={config.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 flex items-center space-x-1"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">Open in New Tab</span>
              </a>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {config.url ? (
            <div className="w-full h-[600px] border rounded-lg overflow-hidden">
              <iframe
                src={config.url}
                className="w-full h-full"
                title={`${config.title} Console`}
                frameBorder="0"
              />
            </div>
          ) : (
            <div className="w-full h-[600px] border rounded-lg bg-muted/10 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Grid3X3 className="w-16 h-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-foreground">Grid URL Not Configured</h3>
                  <p className="text-muted-foreground">
                    Please add the {config.title} URL to display the console here.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {config.url && (
        <Card>
          <CardHeader>
            <CardTitle>Grid Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Environment</p>
                <p className="text-lg font-semibold">{config.badge}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Console URL</p>
                <p className="text-sm text-primary break-all">{config.url}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">{testSessions.length} sessions</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Send, 
  User, 
  Bot, 
  Download, 
  FileText, 
  X, 
  Minimize2, 
  Maximize2,
  Code,
  Copy,
  Check,
  Trash2,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl, buildPromptWithContext } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  hasCode?: boolean;
}

export function QAChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectCodeInMessage = (content: string): boolean => {
    // Detect code blocks, inline code, or common programming patterns
    const codePatterns = [
      /```[\s\S]*?```/g, // Code blocks
      /`[^`\n]+`/g, // Inline code
      /\b(function|const|let|var|if|else|for|while|class|import|export|return)\b/g, // JS keywords
      /\b(def|class|import|from|if|else|for|while|try|except|return)\b/g, // Python keywords
      /[{}();[\]]/g, // Common programming symbols
    ];
    
    return codePatterns.some(pattern => pattern.test(content));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
      hasCode: detectCodeInMessage(inputMessage)
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const savedConfig = localStorage.getItem("qaToolsEndpointConfig");
      let config = defaultEndpointConfig;
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...defaultEndpointConfig, ...parsedConfig };
      }

      const endpointUrl = getToolEndpointUrl("chatbot", config);
      const prompt = buildPromptWithContext("chatbot", inputMessage);
      
      console.log(`Sending message to dev-focused chatbot via ${endpointUrl}`);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          message: inputMessage,
          conversationHistory: messages.slice(-10),
          toolId: "chatbot",
          context: "software_development",
          preferences: {
            includeCodeExamples: true,
            focusOnBestPractices: true,
            includeDebuggingTips: true
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: result.response || result.message || "I'm sorry, I couldn't process your request.",
        isUser: false,
        timestamp: new Date(),
        hasCode: detectCodeInMessage(result.response || result.message || "")
      };

      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting to my backend services. Please check the SVC cluster connection or try again later.",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Connection Error",
        description: "Could not reach QA chatbot service. Check SVC cluster connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const clearConversation = () => {
    setMessages([]);
    toast({
      title: "Conversation Cleared",
      description: "All messages have been removed",
    });
  };

  const exportConversation = (format: 'txt' | 'json' | 'md') => {
    if (messages.length === 0) {
      toast({
        title: "No Conversation",
        description: "Start a conversation before exporting.",
        variant: "destructive",
      });
      return;
    }

    let content: string;
    let mimeType: string;
    let filename: string;

    if (format === 'json') {
      const exportData = {
        timestamp: new Date().toISOString(),
        messages: messages,
        totalMessages: messages.length,
        metadata: {
          exportedBy: "QA Developer Assistant",
          version: "2.0"
        }
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `qa-dev-conversation-${Date.now()}.json`;
    } else if (format === 'md') {
      content = `# QA Developer Assistant Conversation\n\n*Exported: ${new Date().toLocaleString()}*\n\n`;
      content += messages.map(msg => {
        const role = msg.isUser ? '👤 **You**' : '🤖 **QA Assistant**';
        const timestamp = `*${msg.timestamp.toLocaleTimeString()}*`;
        const codeIndicator = msg.hasCode ? ' 📝' : '';
        return `## ${role}${codeIndicator}\n${timestamp}\n\n${msg.content}\n\n---\n`;
      }).join('\n');
      mimeType = 'text/markdown';
      filename = `qa-dev-conversation-${Date.now()}.md`;
    } else {
      content = `QA Developer Assistant Conversation - ${new Date().toLocaleString()}\n${'='.repeat(60)}\n\n`;
      content += messages.map(msg => 
        `[${msg.timestamp.toLocaleTimeString()}] ${msg.isUser ? 'You' : 'QA Assistant'}${msg.hasCode ? ' [CODE]' : ''}: ${msg.content}`
      ).join('\n\n');
      mimeType = 'text/plain';
      filename = `qa-dev-conversation-${Date.now()}.txt`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Conversation exported as ${format.toUpperCase()} file`,
    });
  };

  const formatMessageContent = (content: string) => {
    // Basic code block detection and formatting
    const parts = content.split(/(```[\s\S]*?```|`[^`\n]+`)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).trim();
        const lines = code.split('\n');
        const language = lines[0] || 'text';
        const codeContent = lines.length > 1 ? lines.slice(1).join('\n') : code;
        
        return (
          <div key={index} className="my-2 p-3 bg-gray-900 rounded-lg text-green-400 font-mono text-sm overflow-x-auto">
            {language && language !== codeContent && (
              <div className="text-gray-500 text-xs mb-1">{language}</div>
            )}
            <pre className="whitespace-pre-wrap">{codeContent}</pre>
          </div>
        );
      } else if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-blue-600">
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Floating chat button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="sr-only">Open QA Developer Assistant</span>
        </Button>
      </div>
    );
  }

  // Chat interface
  const chatWidth = isExpanded ? 'w-[600px]' : 'w-96';
  const chatHeight = isMinimized ? 'h-14' : isExpanded ? 'h-[600px]' : 'h-[500px]';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`${chatWidth} ${chatHeight} shadow-2xl transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm`}>
        {/* Enhanced Header */}
        <CardHeader className="pb-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-semibold">QA Dev Assistant</span>
                <div className="text-xs text-blue-100 flex items-center space-x-2">
                  <span>Ready to help with testing & QA</span>
                  {messages.length > 0 && (
                    <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                      {messages.length} msgs
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 p-0 text-white hover:bg-white/20"
                title={isExpanded ? "Shrink" : "Expand"}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-8 h-8 p-0 text-white hover:bg-white/20"
                title={isMinimized ? "Restore" : "Minimize"}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 p-0 text-white hover:bg-white/20"
                title="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        {/* Chat Content */}
        {!isMinimized && (
          <>
            <CardContent className="p-0 flex flex-col h-full">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">QA Developer Assistant</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>I'm here to help with testing, QA, and development questions!</p>
                      <div className="flex flex-wrap gap-1 justify-center mt-3">
                        <Badge variant="outline" className="text-xs">Test Cases</Badge>
                        <Badge variant="outline" className="text-xs">Bug Analysis</Badge>
                        <Badge variant="outline" className="text-xs">Code Review</Badge>
                        <Badge variant="outline" className="text-xs">Best Practices</Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`flex items-start space-x-3 max-w-[85%] ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.isUser 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                            : 'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}>
                          {message.isUser ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex flex-col space-y-1 flex-1">
                          <div
                            className={`px-4 py-3 rounded-2xl text-sm relative ${
                              message.isUser
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md'
                                : 'bg-white text-gray-800 rounded-bl-md border border-gray-200 shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 whitespace-pre-wrap">
                                {message.isUser ? message.content : formatMessageContent(message.content)}
                              </div>
                              <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {message.hasCode && (
                                  <Code className="w-3 h-3 text-gray-500" />
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(message.content, message.id)}
                                  className="w-6 h-6 p-0 hover:bg-gray-100"
                                  title="Copy message"
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-gray-500" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className={`text-xs text-gray-500 px-2 ${message.isUser ? 'text-right' : 'text-left'}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Enhanced Action buttons */}
              {messages.length > 0 && (
                <div className="px-4 py-2 border-t bg-gray-50/50 flex gap-2 justify-between">
                  <div className="flex gap-2">
                    <Button onClick={() => exportConversation('md')} variant="outline" size="sm" className="text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      MD
                    </Button>
                    <Button onClick={() => exportConversation('json')} variant="outline" size="sm" className="text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      JSON
                    </Button>
                  </div>
                  <Button 
                    onClick={clearConversation} 
                    variant="outline" 
                    size="sm" 
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              )}

              {/* Enhanced Input Area */}
              <div className="p-4 border-t bg-white">
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Ask me about testing, QA, debugging, or development best practices..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="text-sm resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      rows={2}
                    />
                    <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                      <span>Shift + Enter for new line</span>
                      {inputMessage.length > 0 && (
                        <span>{inputMessage.length} chars</span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    size="sm"
                    className="self-start mt-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-[60px] px-4"
                  >
                    <Send className="w-4 h-4" />
                    <span className="sr-only">Send message</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}


import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, User, Bot, Download, FileText, X, Minimize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getToolEndpointUrl, buildPromptWithContext } from "@/config/backendConfig";
import { defaultEndpointConfig } from "@/config/backendConfig";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function QAChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
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
      
      console.log(`Sending message to chatbot via ${endpointUrl}`);
      
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          message: inputMessage,
          conversationHistory: messages.slice(-10),
          toolId: "chatbot"
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
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting to my backend services. Please check the SVC cluster connection.",
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

  const exportConversation = (format: 'txt' | 'json') => {
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
        totalMessages: messages.length
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `qa-conversation-${Date.now()}.json`;
    } else {
      content = `QA Chatbot Conversation - ${new Date().toLocaleString()}\n\n`;
      content += messages.map(msg => 
        `[${msg.timestamp.toLocaleTimeString()}] ${msg.isUser ? 'You' : 'QA Bot'}: ${msg.content}`
      ).join('\n\n');
      mimeType = 'text/plain';
      filename = `qa-conversation-${Date.now()}.txt`;
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

  // If chat is not open, show floating chat button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg transition-all duration-200 hover:scale-110"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      </div>
    );
  }

  // Chat interface
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`w-80 h-96 shadow-xl transition-all duration-300 ${isMinimized ? 'h-12' : 'h-96'}`}>
        {/* Chat Header */}
        <CardHeader className="pb-2 px-4 py-3 bg-blue-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span>QA Assistant</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-6 h-6 p-0 text-white hover:bg-blue-600"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 p-0 text-white hover:bg-blue-600"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        {/* Chat Content - only show when not minimized */}
        {!isMinimized && (
          <>
            <CardContent className="p-0 flex flex-col h-full">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bot className="w-8 h-8 text-blue-500 mb-2" />
                    <p className="text-sm text-gray-600">Hi! I'm your QA assistant.</p>
                    <p className="text-xs text-gray-500 mt-1">Ask me anything about testing!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[85%] ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.isUser ? 'bg-blue-500' : 'bg-gray-400'
                        }`}>
                          {message.isUser ? (
                            <User className="w-3 h-3 text-white" />
                          ) : (
                            <Bot className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div
                          className={`px-3 py-2 rounded-lg text-sm ${
                            message.isUser
                              ? 'bg-blue-500 text-white rounded-br-sm'
                              : 'bg-white text-gray-800 rounded-bl-sm border'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <div className="bg-white border px-3 py-2 rounded-lg rounded-bl-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Export buttons */}
              {messages.length > 0 && (
                <div className="px-4 py-2 border-t bg-white flex gap-2">
                  <Button onClick={() => exportConversation('txt')} variant="outline" size="sm" className="text-xs">
                    <Download className="w-3 h-3 mr-1" />
                    TXT
                  </Button>
                  <Button onClick={() => exportConversation('json')} variant="outline" size="sm" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    JSON
                  </Button>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t bg-white">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 text-sm resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    size="sm"
                    className="self-end bg-blue-500 hover:bg-blue-600"
                  >
                    <Send className="w-4 h-4" />
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


import { useState } from "react";
import { 
  CircleOff, 
  Circle, 
  Eye, 
  MousePointerClick, 
  AlignJustify, 
  Download, 
  Trash2, 
  ArrowLeft, 
  Check, 
  FileText,
  List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RecordingSidebarProps {
  isRecording: boolean;
  isAssertionMode: boolean;
  events: any[];
  startRecording: () => void;
  stopRecording: () => void;
  toggleAssertionMode: () => void;
  exportEvents: () => void;
  clearEvents: () => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const RecordingSidebar = ({
  isRecording,
  isAssertionMode,
  events,
  startRecording,
  stopRecording,
  toggleAssertionMode,
  exportEvents,
  clearEvents,
  collapsed,
  setCollapsed,
}: RecordingSidebarProps) => {
  const [showEvents, setShowEvents] = useState(false);

  const getEventIcon = (event: any) => {
    switch (event.type) {
      case "click":
        return <MousePointerClick className="h-4 w-4" />;
      case "input":
        return <FileText className="h-4 w-4" />;
      case "assertion":
        return <Check className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getEventDescription = (event: any) => {
    switch (event.type) {
      case "click":
        return `Clicked on ${event.selector}`;
      case "input":
        return `Typed "${event.value}" into ${event.selector}`;
      case "assertion":
        return `Assert ${event.assertionType} on ${event.selector}`;
      default:
        return `${event.type} event`;
    }
  };

  return (
    <div
      className={cn(
        "bg-slate-900 text-white flex flex-col transition-all duration-300 border-r border-slate-700",
        collapsed ? "w-16" : "w-72"
      )}
    >
      <div className="flex justify-between items-center p-4 border-b border-slate-700">
        {!collapsed && <h2 className="font-semibold">Bug Testing Tool</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {collapsed ? (
            <AlignJustify className="h-5 w-5" />
          ) : (
            <ArrowLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "w-full flex items-center justify-center",
                  collapsed ? "p-0 h-10 w-10" : ""
                )}
              >
                {isRecording ? (
                  <>
                    {!collapsed && <span className="mr-2">Stop Recording</span>}
                    <CircleOff className="h-5 w-5" />
                  </>
                ) : (
                  <>
                    {!collapsed && <span className="mr-2">Start Recording</span>}
                    <Circle className="h-5 w-5" />
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isRecording ? "Stop Recording" : "Start Recording"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {isRecording && (
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant={isAssertionMode ? "secondary" : "outline"} 
                  onClick={toggleAssertionMode}
                  className={cn(
                    "w-full flex items-center justify-center",
                    collapsed ? "p-0 h-10 w-10" : "",
                    isAssertionMode ? "bg-indigo-700 hover:bg-indigo-800 text-white" : ""
                  )}
                >
                  {!collapsed && <span className="mr-2">Add Assertion</span>}
                  <Eye className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Add Assertion
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {events.length > 0 && (
          <>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={exportEvents}
                    className={cn(
                      "w-full flex items-center justify-center",
                      collapsed ? "p-0 h-10 w-10" : ""
                    )}
                  >
                    {!collapsed && <span className="mr-2">Export Events</span>}
                    <Download className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Export Events
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={clearEvents}
                    className={cn(
                      "w-full flex items-center justify-center",
                      collapsed ? "p-0 h-10 w-10" : ""
                    )}
                  >
                    {!collapsed && <span className="mr-2">Clear Events</span>}
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Clear Events
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>

      {!collapsed && events.length > 0 && (
        <>
          <div className="p-4 border-t border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Recorded Events</h3>
              <Badge variant="outline">{events.length}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm flex items-center justify-center"
              onClick={() => setShowEvents(!showEvents)}
            >
              <span className="mr-2">{showEvents ? "Hide Events" : "Show Events"}</span>
              <List className="h-4 w-4" />
            </Button>
          </div>

          {showEvents && (
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {events.map((event, index) => (
                  <div
                    key={index}
                    className="text-xs bg-slate-800 p-2 rounded border border-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      {getEventIcon(event)}
                      <span>{getEventDescription(event)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </>
      )}
    </div>
  );
};


import { useState } from "react";
import { RecordingSidebar } from "./RecordingSidebar";
import { RecordingOverlay } from "./RecordingOverlay";
import { EventRecorder } from "@/lib/event-recorder";
import { AppContent } from "./AppContent";
import { toast } from "@/hooks/use-toast";

export const BugTestingTool = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAssertionMode, setIsAssertionMode] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const startRecording = () => {
    setIsRecording(true);
    EventRecorder.start((event) => {
      setEvents((prev) => [...prev, event]);
    });
    
    toast({
      title: "Recording Started",
      description: "All user interactions are now being recorded",
      duration: 3000,
    });
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsAssertionMode(false);
    EventRecorder.stop();
    
    toast({
      title: "Recording Stopped",
      description: `Captured ${events.length} events`,
      duration: 3000,
    });
    
    console.log("Recording stopped. Collected events:", events);
  };

  const toggleAssertionMode = () => {
    setIsAssertionMode(!isAssertionMode);
    
    if (!isAssertionMode) {
      toast({
        title: "Assertion Mode Enabled",
        description: "Click on elements to add assertions",
        duration: 3000,
      });
    } else {
      toast({
        title: "Assertion Mode Disabled",
        description: "Continuing with event recording",
        duration: 3000,
      });
    }
  };

  const addAssertion = (type: string, selector: string, value?: string) => {
    const assertion = {
      type: "assertion",
      assertionType: type,
      selector,
      value,
      timestamp: new Date().getTime(),
    };
    
    setEvents((prev) => [...prev, assertion]);
    setIsAssertionMode(false);
    
    toast({
      title: "Assertion Added",
      description: `Added ${type} assertion for the selected element`,
      duration: 3000,
    });
  };

  const exportEvents = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `bug-test-recording-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Test Exported",
      description: "Recording has been saved as JSON file",
      duration: 3000,
    });
  };

  const clearEvents = () => {
    setEvents([]);
    
    toast({
      title: "Events Cleared",
      description: "All recorded events have been cleared",
      duration: 3000,
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <RecordingSidebar
        isRecording={isRecording}
        isAssertionMode={isAssertionMode}
        events={events}
        startRecording={startRecording}
        stopRecording={stopRecording}
        toggleAssertionMode={toggleAssertionMode}
        exportEvents={exportEvents}
        clearEvents={clearEvents}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      
      <div className="flex-1 relative overflow-auto">
        {isRecording && (
          <RecordingOverlay 
            isAssertionMode={isAssertionMode} 
            addAssertion={addAssertion}
          />
        )}
        <AppContent />
      </div>
    </div>
  );
};

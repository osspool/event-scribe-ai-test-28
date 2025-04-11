
import { useState, useEffect } from "react";
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
  const [recordingPaused, setRecordingPaused] = useState(false);

  // Effect to handle recording state when assertion mode changes
  useEffect(() => {
    if (isAssertionMode && isRecording) {
      // Pause recording when entering assertion mode
      EventRecorder.stop();
      setRecordingPaused(true);
      
      console.log("Recording paused for assertion mode");
    } else if (!isAssertionMode && isRecording && recordingPaused) {
      // Resume recording when exiting assertion mode if it was paused
      EventRecorder.start((event) => {
        setEvents((prev) => [...prev, event]);
      });
      setRecordingPaused(false);
      
      console.log("Recording resumed after assertion mode");
    }
  }, [isAssertionMode, isRecording, recordingPaused]);

  const startRecording = () => {
    setIsRecording(true);
    if (!isAssertionMode) {
      EventRecorder.start((event) => {
        setEvents((prev) => [...prev, event]);
      });
      
      toast({
        title: "Recording Started",
        description: "All user interactions are now being recorded",
        duration: 3000,
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsAssertionMode(false);
    EventRecorder.stop();
    setRecordingPaused(false);
    
    toast({
      title: "Recording Stopped",
      description: `Captured ${events.length} events`,
      duration: 3000,
    });
    
    console.log("Recording stopped. Collected events:", events);
  };

  const toggleAssertionMode = () => {
    // If turning assertion mode on
    if (!isAssertionMode) {
      // Pause the recording when entering assertion mode
      if (isRecording && !recordingPaused) {
        EventRecorder.stop();
        setRecordingPaused(true);
      }
      
      setIsAssertionMode(true);
      
      toast({
        title: "Assertion Mode Enabled",
        description: "Click on elements to add assertions. Recording paused.",
        duration: 3000,
      });
    } 
    // If turning assertion mode off
    else {
      setIsAssertionMode(false);
      
      // Resume recording if it was paused for assertion mode
      if (isRecording && recordingPaused) {
        EventRecorder.start((event) => {
          setEvents((prev) => [...prev, event]);
        });
        setRecordingPaused(false);
        
        toast({
          title: "Assertion Mode Disabled",
          description: "Recording resumed",
          duration: 3000,
        });
      } else {
        toast({
          title: "Assertion Mode Disabled",
          description: "Continuing with event recording",
          duration: 3000,
        });
      }
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


import { useState } from "react";
import { RecordingSidebar } from "./RecordingSidebar";
import { RecordingOverlay } from "./RecordingOverlay";
import { EventRecorder } from "@/lib/event-recorder";
import { AppContent } from "./AppContent";

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
  };

  const stopRecording = () => {
    setIsRecording(false);
    EventRecorder.stop();
    console.log("Recording stopped. Collected events:", events);
  };

  const toggleAssertionMode = () => {
    setIsAssertionMode(!isAssertionMode);
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
  };

  const exportEvents = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `bug-test-recording-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const clearEvents = () => {
    setEvents([]);
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

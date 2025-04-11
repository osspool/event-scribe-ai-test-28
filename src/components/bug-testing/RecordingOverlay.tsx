import { useState, useRef, useEffect } from "react";
import { X, CheckCircle2, Eye, MousePointerClick, FileText, Search, Hand, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface RecordingOverlayProps {
  isAssertionMode: boolean;
  addAssertion: (type: string, selector: string, value?: string) => void;
}

export const RecordingOverlay = ({ isAssertionMode, addAssertion }: RecordingOverlayProps) => {
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [selectedSelector, setSelectedSelector] = useState("");
  const [assertionType, setAssertionType] = useState("isVisible");
  const [assertionValue, setAssertionValue] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);
  const [inspectingPath, setInspectingPath] = useState<HTMLElement[]>([]);
  const [selectorOptions, setSelectorOptions] = useState<string[]>([]);
  const [dynamicElementInfo, setDynamicElementInfo] = useState<{isToast?: boolean, isDropdown?: boolean}>({});

  useEffect(() => {
    if (!isAssertionMode) {
      setSelectedElement(null);
      setPopoverOpen(false);
      setInspectingPath([]);
    } else {
      // Show help dialog on first use of assertion mode
      const hasSeenHelp = localStorage.getItem('assertionHelpSeen');
      if (!hasSeenHelp) {
        setHelpDialogOpen(true);
        localStorage.setItem('assertionHelpSeen', 'true');
      }
    }
  }, [isAssertionMode]);

  // Update element position when it might have moved (for floating elements)
  useEffect(() => {
    if (!selectedElement) return;
    
    const updateElementPosition = () => {
      if (selectedElement) {
        setElementRect(selectedElement.getBoundingClientRect());
      }
    };
    
    // Update initially and then on various events that might cause repositioning
    updateElementPosition();
    
    window.addEventListener('scroll', updateElementPosition);
    window.addEventListener('resize', updateElementPosition);
    window.addEventListener('mousemove', updateElementPosition);
    
    const animationFrame = setInterval(updateElementPosition, 100); // More frequent updates for better tracking
    
    return () => {
      window.removeEventListener('scroll', updateElementPosition);
      window.removeEventListener('resize', updateElementPosition);
      window.removeEventListener('mousemove', updateElementPosition);
      clearInterval(animationFrame);
    };
  }, [selectedElement]);

  // Track elements under mouse for hover effect
  const handleElementHover = (e: React.MouseEvent) => {
    if (!isAssertionMode) return;
    
    const target = e.target as HTMLElement;
    if (target === overlayRef.current) return;
    
    // Create path from target to document body
    const path: HTMLElement[] = [];
    let currentElement: HTMLElement | null = target;
    
    while (currentElement && currentElement !== document.body) {
      path.push(currentElement);
      currentElement = currentElement.parentElement;
    }
    
    setInspectingPath(path);
  };

  // Detect if element is a toast, dropdown or other dynamic element
  const detectDynamicElement = (element: HTMLElement) => {
    // Check for toast
    const isToast = element.closest('[role="alert"]') !== null || 
                    element.closest('[toast]') !== null ||
                    element.closest('[data-radix-toast-root]') !== null;
    
    // Check for dropdown
    const isDropdown = element.closest('[role="menu"]') !== null || 
                       element.closest('[role="listbox"]') !== null ||
                       element.closest('[data-radix-dropdown-menu-content]') !== null ||
                       element.closest('[data-radix-popover-content]') !== null;
    
    return { isToast, isDropdown };
  };

  // Generate multiple selector options for the element
  const generateSelectorOptions = (element: HTMLElement): string[] => {
    const options: string[] = [];
    
    // ID selector (highest priority)
    if (element.id) {
      options.push(`#${element.id}`);
    }
    
    // Role attribute (good for accessibility and consistent across implementations)
    const role = element.getAttribute('role');
    if (role) {
      options.push(`[role="${role}"]`);
    }
    
    // Data attributes (good for component libraries like Radix)
    for (const attr of Array.from(element.attributes)) {
      if (attr.name.startsWith('data-')) {
        options.push(`[${attr.name}="${attr.value}"]`);
      }
    }
    
    // Aria attributes (good for component libraries and accessibility)
    for (const attr of Array.from(element.attributes)) {
      if (attr.name.startsWith('aria-')) {
        options.push(`[${attr.name}="${attr.value}"]`);
      }
    }
    
    // Class selector (if classes exist)
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ')
        .filter(c => c && !c.includes('hover') && !c.includes('focus'));
      
      if (classes.length > 0) {
        // Add individual classes and combinations
        if (classes.length === 1) {
          options.push(`.${classes[0]}`);
        } else {
          // Add the first class as an option
          options.push(`.${classes[0]}`);
          // Add a more specific selector with multiple classes
          options.push(`.${classes.slice(0, Math.min(3, classes.length)).join('.')}`);
        }
      }
    }
    
    // Tag with specific text content (for text elements)
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length < 30 && textContent.length > 0) {
      const tagName = element.tagName.toLowerCase();
      options.push(`${tagName}:contains("${textContent.substring(0, 20)}")`);
    }
    
    // Tag with position
    const tagName = element.tagName.toLowerCase();
    const siblings = Array.from(element.parentNode?.children || []);
    const index = siblings.indexOf(element) + 1;
    
    // Add parent context for more specificity
    if (element.parentElement && element.parentElement !== document.body) {
      const parentTag = element.parentElement.tagName.toLowerCase();
      options.push(`${parentTag} > ${tagName}:nth-child(${index})`);
    } else {
      options.push(`${tagName}:nth-child(${index})`);
    }
    
    return options;
  };

  const handleElementSelection = (e: React.MouseEvent) => {
    if (!isAssertionMode) return;
    
    // Stop event propagation to prevent button clicks and other events
    e.preventDefault();
    e.stopPropagation();
    
    // Get the target element, but skip the overlay itself
    const target = e.target as HTMLElement;
    if (target === overlayRef.current) return;
    
    // Check if we're clicking on the "Need help" button or another UI control
    const isHelpButton = target.closest('[data-help-button="true"]');
    if (isHelpButton) {
      // Allow the button click to go through without selecting the element
      return;
    }
    
    // Check if target is a dynamic element (toast, dropdown)
    const dynamicInfo = detectDynamicElement(target);
    setDynamicElementInfo(dynamicInfo);
    
    setSelectedElement(target);
    const selectorOpts = generateSelectorOptions(target);
    setSelectorOptions(selectorOpts);
    setSelectedSelector(selectorOpts[0] || "");
    setElementRect(target.getBoundingClientRect());
    setPopoverOpen(true);
    setInspectingPath([]);
    
    toast({
      title: "Element Selected",
      description: `Selected ${dynamicInfo.isToast ? 'toast' : dynamicInfo.isDropdown ? 'dropdown' : 'element'} with selector: ${selectorOpts[0] || "unknown"}`,
      duration: 3000,
    });
  };

  const handleSubmitAssertion = () => {
    if (!selectedSelector) return;
    
    addAssertion(assertionType, selectedSelector, assertionValue);
    setPopoverOpen(false);
    setSelectedElement(null);
    setAssertionValue("");
    
    toast({
      title: "Assertion Added",
      description: `Added ${assertionType} assertion for ${selectedSelector}`,
      duration: 3000,
    });
  };

  const getAssertionIcon = () => {
    switch (assertionType) {
      case "isVisible":
        return <Eye className="h-4 w-4" />;
      case "isClickable":
        return <MousePointerClick className="h-4 w-4" />;
      case "hasText":
        return <FileText className="h-4 w-4" />;
      case "hasValue":
        return <Type className="h-4 w-4" />;
      case "exists":
        return <Search className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  // Handle buttons and interactive elements specially
  const handleButtonClick = (e: React.MouseEvent) => {
    if (!isAssertionMode) return;
    
    const target = e.target as HTMLElement;
    const button = target.closest('button');
    
    // If this is a UI control button for our overlay, don't prevent default
    if (button && button.hasAttribute('data-assertion-control')) {
      return;
    }
    
    // Otherwise prevent the button click during assertion mode
    e.preventDefault();
    e.stopPropagation();
    
    // And proceed with element selection
    handleElementSelection(e);
  };

  return (
    <>
      <div 
        ref={overlayRef}
        className={`absolute inset-0 z-50 ${isAssertionMode ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
        onClick={handleElementSelection}
        onMouseMove={handleElementHover}
      >
        {isAssertionMode && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-indigo-900 text-white py-2 px-6 rounded-full z-50 flex items-center gap-2 shadow-lg border border-indigo-700">
            <Eye className="h-5 w-5 text-indigo-300" />
            <span>Click on any element to add assertion</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-6 text-xs text-indigo-300 hover:text-white hover:bg-indigo-800"
              onClick={(e) => {
                e.stopPropagation();
                setHelpDialogOpen(true);
              }}
              data-assertion-control="true"
              data-help-button="true"
            >
              Need help?
            </Button>
          </div>
        )}
        
        {/* Capture clicks on buttons specifically to prevent them from firing */}
        {isAssertionMode && (
          <div 
            className="absolute inset-0 z-[51]" 
            onClick={handleButtonClick}
          ></div>
        )}
        
        {/* Highlight elements on hover */}
        {isAssertionMode && inspectingPath.length > 0 && !selectedElement && (
          <>
            {inspectingPath.map((element, index) => {
              const rect = element.getBoundingClientRect();
              const isTopElement = index === 0;
              
              return (
                <div 
                  key={index}
                  className={`absolute border-2 pointer-events-none z-${50 - index} ${
                    isTopElement 
                      ? 'border-indigo-500 bg-indigo-500 bg-opacity-10' 
                      : 'border-blue-300 border-opacity-40'
                  }`}
                  style={{
                    left: `${rect.left}px`,
                    top: `${rect.top}px`,
                    width: `${rect.width}px`,
                    height: `${rect.height}px`,
                    position: 'fixed'
                  }}
                />
              );
            })}
          </>
        )}
        
        {isAssertionMode && selectedElement && elementRect && (
          <>
            {/* Element highlight overlay */}
            <div 
              className="fixed bg-indigo-600 bg-opacity-30 border-2 border-indigo-600 pointer-events-none z-40"
              style={{
                left: `${elementRect.left}px`,
                top: `${elementRect.top}px`,
                width: `${elementRect.width}px`,
                height: `${elementRect.height}px`
              }}
            />
            
            {/* Assertion popover */}
            <div className="fixed bottom-4 right-4 z-[100]">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="default" 
                    className="gap-2 bg-indigo-700 hover:bg-indigo-800"
                    data-assertion-control="true"
                  >
                    {getAssertionIcon()}
                    Add Assertion
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-4 border-indigo-300 bg-slate-900 text-white z-[100]">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                      <h3 className="font-medium text-indigo-300">Create Assertion</h3>
                      {dynamicElementInfo.isToast && (
                        <span className="text-xs bg-amber-800 px-2 py-1 rounded">Toast Element</span>
                      )}
                      {dynamicElementInfo.isDropdown && (
                        <span className="text-xs bg-amber-800 px-2 py-1 rounded">Dropdown Element</span>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setPopoverOpen(false)}
                        className="text-slate-400 hover:text-white hover:bg-slate-800"
                        data-assertion-control="true"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-slate-300">Element Selector</Label>
                      <Select 
                        value={selectedSelector} 
                        onValueChange={setSelectedSelector}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Select element selector" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white z-[200]">
                          {selectorOptions.map((option, index) => (
                            <SelectItem key={index} value={option} className="hover:bg-slate-700 focus:bg-slate-700">
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-400">
                        Choose the most specific selector for reliable test runs
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-slate-300">Assertion Type</Label>
                      <Select 
                        value={assertionType} 
                        onValueChange={setAssertionType}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Select assertion type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white z-[200]">
                          <SelectItem value="isVisible" className="hover:bg-slate-700 focus:bg-slate-700">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-indigo-400" />
                              <span>Is Visible</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="isClickable" className="hover:bg-slate-700 focus:bg-slate-700">
                            <div className="flex items-center gap-2">
                              <MousePointerClick className="h-4 w-4 text-indigo-400" />
                              <span>Is Clickable</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="hasText" className="hover:bg-slate-700 focus:bg-slate-700">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-indigo-400" />
                              <span>Has Text</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="hasValue" className="hover:bg-slate-700 focus:bg-slate-700">
                            <div className="flex items-center gap-2">
                              <Type className="h-4 w-4 text-indigo-400" />
                              <span>Has Value</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="exists" className="hover:bg-slate-700 focus:bg-slate-700">
                            <div className="flex items-center gap-2">
                              <Search className="h-4 w-4 text-indigo-400" />
                              <span>Exists</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(assertionType === "hasText" || assertionType === "hasValue") && (
                      <div className="space-y-2">
                        <Label className="text-slate-300">Expected Value</Label>
                        <Input 
                          value={assertionValue} 
                          onChange={(e) => setAssertionValue(e.target.value)}
                          placeholder="Enter expected value"
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    )}
                    
                    <Button 
                      className="w-full bg-indigo-700 hover:bg-indigo-800 text-white"
                      onClick={handleSubmitAssertion}
                      data-assertion-control="true"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Add Assertion
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
        
        {isAssertionMode && !selectedElement && (
          <div className="absolute inset-0 bg-indigo-500 bg-opacity-5 border-2 border-indigo-500 border-opacity-30 pointer-events-none" />
        )}
      </div>
      
      {/* Help Dialog */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="bg-slate-900 text-white border-slate-700 z-[200]">
          <DialogHeader>
            <DialogTitle className="text-indigo-300">How to Add Assertions</DialogTitle>
            <DialogDescription className="text-slate-300">
              Assertions verify that elements behave as expected during testing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3 p-3 bg-slate-800 rounded">
              <div className="mt-1"><MousePointerClick className="h-5 w-5 text-indigo-400" /></div>
              <div>
                <h4 className="font-semibold mb-1">Select an Element</h4>
                <p className="text-slate-300">Click on any element in your app to create an assertion about it. This works for all elements including dropdowns and toast notifications.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-slate-800 rounded">
              <div className="mt-1"><Hand className="h-5 w-5 text-indigo-400" /></div>
              <div>
                <h4 className="font-semibold mb-1">Choose a Selector</h4>
                <p className="text-slate-300">We'll generate selector options based on the element's attributes. Pick the most specific one for reliable tests.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-slate-800 rounded">
              <div className="mt-1"><CheckCircle2 className="h-5 w-5 text-indigo-400" /></div>
              <div>
                <h4 className="font-semibold mb-1">Define Your Assertion</h4>
                <p className="text-slate-300">Select what you want to verify about the element (visibility, text content, etc) and add any expected values.</p>
              </div>
            </div>
            
            <Button 
              className="w-full mt-4 bg-indigo-700 hover:bg-indigo-800"
              onClick={() => setHelpDialogOpen(false)}
              data-assertion-control="true"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

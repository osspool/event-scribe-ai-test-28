
import { useState, useRef, useEffect } from "react";
import { X, CheckCircle2, Eye, MousePointerClick, FileText } from "lucide-react";
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
import { toast } from "@/components/ui/use-toast";

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
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAssertionMode) {
      setSelectedElement(null);
      setPopoverOpen(false);
    }
  }, [isAssertionMode]);

  // Generate a unique selector for the element
  const generateSelector = (element: HTMLElement): string => {
    // Try to use ID
    if (element.id) {
      return `#${element.id}`;
    }
    
    // Try to use a unique class
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ')
        .filter(c => c && !c.includes('hover') && !c.includes('focus'));
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }
    
    // Use tag name and position
    const tagName = element.tagName.toLowerCase();
    const siblings = Array.from(element.parentNode?.children || []);
    const index = siblings.indexOf(element) + 1;
    
    return `${tagName}:nth-child(${index})`;
  };

  const handleElementSelection = (e: React.MouseEvent) => {
    if (!isAssertionMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Get the target element
    const target = e.target as HTMLElement;
    if (target === overlayRef.current) return;
    
    setSelectedElement(target);
    const selector = generateSelector(target);
    setSelectedSelector(selector);
    setPopoverOpen(true);
    
    toast({
      title: "Element Selected",
      description: `Selected element with selector: ${selector}`,
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
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  return (
    <div 
      ref={overlayRef}
      className={`absolute inset-0 z-50 ${isAssertionMode ? 'pointer-events-auto' : 'pointer-events-none'}`}
      onClick={handleElementSelection}
    >
      {isAssertionMode && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white py-2 px-4 rounded-full z-50 flex items-center gap-2 shadow-lg">
          <Eye className="h-4 w-4" />
          <span>Click on an element to create an assertion</span>
        </div>
      )}
      
      {isAssertionMode && selectedElement && (
        <div className="fixed bottom-4 right-4 z-50">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="default" className="gap-2">
                {getAssertionIcon()}
                Add Assertion
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Create Assertion</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setPopoverOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Element Selector</Label>
                  <Input 
                    value={selectedSelector} 
                    onChange={(e) => setSelectedSelector(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Assertion Type</Label>
                  <Select 
                    value={assertionType} 
                    onValueChange={setAssertionType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assertion type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="isVisible">Is Visible</SelectItem>
                      <SelectItem value="isClickable">Is Clickable</SelectItem>
                      <SelectItem value="hasText">Has Text</SelectItem>
                      <SelectItem value="hasValue">Has Value</SelectItem>
                      <SelectItem value="exists">Exists</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(assertionType === "hasText" || assertionType === "hasValue") && (
                  <div className="space-y-2">
                    <Label>Expected Value</Label>
                    <Input 
                      value={assertionValue} 
                      onChange={(e) => setAssertionValue(e.target.value)}
                      placeholder="Enter expected value"
                    />
                  </div>
                )}
                
                <Button 
                  className="w-full"
                  onClick={handleSubmitAssertion}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Add Assertion
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      
      {isAssertionMode && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 pointer-events-none" />
      )}
    </div>
  );
};


/**
 * EventRecorder - Captures and organizes browser events for test generation
 */

type EventCallback = (event: any) => void;
type EventHandler = (event: Event) => void;

interface RecordedEvent {
  type: string;
  timestamp: number;
  target?: string;
  selector?: string;
  value?: string;
  x?: number;
  y?: number;
  key?: string;
  url?: string;
  metadata?: Record<string, any>;
}

class EventRecorderClass {
  private recording = false;
  private handlers: Record<string, EventHandler> = {};
  private callback: EventCallback | null = null;
  
  /**
   * Start recording browser events
   */
  public start(callback: EventCallback): void {
    if (this.recording) return;
    
    this.recording = true;
    this.callback = callback;
    
    // Attach event listeners
    this.setupEventListeners();
    
    // Log initial page state
    this.recordEvent({
      type: 'navigation',
      url: window.location.href,
      timestamp: Date.now()
    });
    
    console.log('Event recording started');
  }
  
  /**
   * Stop recording browser events
   */
  public stop(): void {
    if (!this.recording) return;
    
    this.recording = false;
    this.callback = null;
    
    // Remove all event listeners
    this.removeEventListeners();
    
    console.log('Event recording stopped');
  }
  
  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    // Mouse events
    this.addEventHandler('click', this.handleClick.bind(this));
    this.addEventHandler('dblclick', this.handleMouseEvent.bind(this, 'dblclick'));
    this.addEventHandler('contextmenu', this.handleMouseEvent.bind(this, 'rightClick'));
    
    // Form events
    this.addEventHandler('input', this.handleInput.bind(this));
    this.addEventHandler('change', this.handleChange.bind(this));
    this.addEventHandler('submit', this.handleSubmit.bind(this));
    
    // Keyboard events
    this.addEventHandler('keydown', this.handleKeyDown.bind(this));
    
    // Navigation events
    window.addEventListener('popstate', this.handleNavigation.bind(this));
    
    // Scroll events (throttled)
    this.addThrottledEventHandler('scroll', this.handleScroll.bind(this), 300);
  }
  
  /**
   * Remove all event listeners
   */
  private removeEventListeners(): void {
    for (const [eventType, handler] of Object.entries(this.handlers)) {
      document.removeEventListener(eventType, handler, true);
    }
    
    window.removeEventListener('popstate', this.handleNavigation.bind(this));
    
    this.handlers = {};
  }
  
  /**
   * Add event handler with capturing phase
   */
  private addEventHandler(eventType: string, handler: EventHandler): void {
    this.handlers[eventType] = handler;
    document.addEventListener(eventType, handler, true);
  }
  
  /**
   * Add throttled event handler
   */
  private addThrottledEventHandler(
    eventType: string, 
    handler: EventHandler, 
    delay: number
  ): void {
    let lastExecution = 0;
    
    const throttledHandler = (event: Event) => {
      const now = Date.now();
      
      if (now - lastExecution >= delay) {
        lastExecution = now;
        handler(event);
      }
    };
    
    this.handlers[eventType] = throttledHandler;
    document.addEventListener(eventType, throttledHandler, true);
  }
  
  /**
   * Record an event by sending it to the callback
   */
  private recordEvent(event: RecordedEvent): void {
    if (!this.recording || !this.callback) return;
    
    this.callback(event);
  }
  
  /**
   * Generate a CSS selector for an element
   */
  private generateSelector(element: HTMLElement): string {
    // Try ID
    if (element.id) {
      return `#${element.id}`;
    }
    
    // Try class names
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ')
        .filter(c => c && !c.includes('hover') && !c.includes('focus'));
      
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }
    
    // Try data attributes
    for (const attr of Array.from(element.attributes)) {
      if (attr.name.startsWith('data-')) {
        return `[${attr.name}="${attr.value}"]`;
      }
    }
    
    // Use tag name and position
    const tagName = element.tagName.toLowerCase();
    let selector = tagName;
    
    if (element.parentElement) {
      const siblings = Array.from(element.parentElement.children)
        .filter(node => node.tagName === element.tagName);
      
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }
    
    // Add parent context for better uniqueness
    if (element.parentElement && element.parentElement !== document.body) {
      const parentSelector = this.generateSelector(element.parentElement);
      return `${parentSelector} > ${selector}`;
    }
    
    return selector;
  }
  
  /**
   * Handle click events
   */
  private handleClick(event: Event): void {
    if (!this.recording) return;
    
    const mouseEvent = event as MouseEvent;
    const target = mouseEvent.target as HTMLElement;
    
    this.recordEvent({
      type: 'click',
      timestamp: Date.now(),
      selector: this.generateSelector(target),
      x: mouseEvent.clientX,
      y: mouseEvent.clientY,
      metadata: {
        tagName: target.tagName.toLowerCase(),
        innerText: target.innerText?.slice(0, 50),
        href: (target as HTMLAnchorElement).href,
      }
    });
  }
  
  /**
   * Handle mouse events (non-click)
   */
  private handleMouseEvent(type: string, event: Event): void {
    if (!this.recording) return;
    
    const mouseEvent = event as MouseEvent;
    const target = mouseEvent.target as HTMLElement;
    
    this.recordEvent({
      type,
      timestamp: Date.now(),
      selector: this.generateSelector(target),
      x: mouseEvent.clientX,
      y: mouseEvent.clientY,
    });
  }
  
  /**
   * Handle input events
   */
  private handleInput(event: Event): void {
    if (!this.recording) return;
    
    const inputEvent = event as InputEvent;
    const target = inputEvent.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    
    this.recordEvent({
      type: 'input',
      timestamp: Date.now(),
      selector: this.generateSelector(target as HTMLElement),
      value: target.value,
      metadata: {
        inputType: inputEvent.inputType,
        tagName: target.tagName.toLowerCase(),
      }
    });
  }
  
  /**
   * Handle change events
   */
  private handleChange(event: Event): void {
    if (!this.recording) return;
    
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    
    // Skip for text inputs (already captured by input event)
    if (
      target.tagName === 'INPUT' && 
      (target.type === 'text' || target.type === 'password' || target.type === 'email')
    ) {
      return;
    }
    
    let value: string | boolean = target.value;
    
    // Handle checkbox
    if (target.tagName === 'INPUT' && target.type === 'checkbox') {
      value = (target as HTMLInputElement).checked;
    }
    
    this.recordEvent({
      type: 'change',
      timestamp: Date.now(),
      selector: this.generateSelector(target as HTMLElement),
      value: String(value),
      metadata: {
        tagName: target.tagName.toLowerCase(),
        inputType: (target as HTMLInputElement).type
      }
    });
  }
  
  /**
   * Handle form submission
   */
  private handleSubmit(event: Event): void {
    if (!this.recording) return;
    
    const target = event.target as HTMLFormElement;
    
    // Collect form data
    const formData: Record<string, string> = {};
    const formElements = Array.from(target.elements) as HTMLInputElement[];
    
    formElements.forEach(element => {
      if (element.name) {
        if (element.type === 'checkbox' || element.type === 'radio') {
          if (element.checked) {
            formData[element.name] = element.value;
          }
        } else {
          formData[element.name] = element.value;
        }
      }
    });
    
    this.recordEvent({
      type: 'submit',
      timestamp: Date.now(),
      selector: this.generateSelector(target),
      metadata: {
        formData,
        action: target.action,
        method: target.method
      }
    });
  }
  
  /**
   * Handle key down events
   */
  private handleKeyDown(event: Event): void {
    if (!this.recording) return;
    
    const keyEvent = event as KeyboardEvent;
    
    // Skip modifier keys alone
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(keyEvent.key)) {
      return;
    }
    
    // Skip regular typing (captured by input event)
    if (
      keyEvent.target instanceof HTMLInputElement || 
      keyEvent.target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    
    // Special key combinations
    const modifiers = [];
    if (keyEvent.ctrlKey) modifiers.push('Ctrl');
    if (keyEvent.altKey) modifiers.push('Alt');
    if (keyEvent.shiftKey) modifiers.push('Shift');
    if (keyEvent.metaKey) modifiers.push('Meta');
    
    this.recordEvent({
      type: 'keydown',
      timestamp: Date.now(),
      key: keyEvent.key,
      metadata: {
        modifiers,
        keyCode: keyEvent.keyCode
      }
    });
  }
  
  /**
   * Handle navigation events
   */
  private handleNavigation(): void {
    if (!this.recording) return;
    
    this.recordEvent({
      type: 'navigation',
      timestamp: Date.now(),
      url: window.location.href
    });
  }
  
  /**
   * Handle scroll events
   */
  private handleScroll(event: Event): void {
    if (!this.recording) return;
    
    const target = event.target as HTMLElement;
    const isWindow = target === document || target === document.documentElement || target === document.body;
    
    this.recordEvent({
      type: 'scroll',
      timestamp: Date.now(),
      selector: isWindow ? 'window' : this.generateSelector(target),
      metadata: {
        scrollX: isWindow ? window.scrollX : target.scrollLeft,
        scrollY: isWindow ? window.scrollY : target.scrollTop
      }
    });
  }
}

// Export singleton instance
export const EventRecorder = new EventRecorderClass();


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const AppContent = () => {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Bug Testing Demo App</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Form</CardTitle>
            <CardDescription>
              Try interacting with this form while recording to test the event capturing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea 
                  id="message" 
                  className="w-full min-h-[100px] p-2 border rounded-md"
                  placeholder="Enter your message"
                ></textarea>
              </div>
              
              <Button type="submit" className="w-full">Submit Form</Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Interactive Elements</CardTitle>
            <CardDescription>
              Various UI elements to test different interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="buttons">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="buttons">Buttons</TabsTrigger>
                <TabsTrigger value="inputs">Inputs</TabsTrigger>
                <TabsTrigger value="lists">Lists</TabsTrigger>
              </TabsList>
              
              <TabsContent value="buttons" className="space-y-4">
                <h3 className="font-medium">Test Button Clicks</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="default">Primary Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="destructive">Danger Button</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="inputs" className="space-y-4">
                <h3 className="font-medium">Test Input Fields</h3>
                <div className="space-y-2">
                  <Label htmlFor="text-input">Text Input</Label>
                  <Input id="text-input" placeholder="Type something here" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number-input">Number Input</Label>
                  <Input id="number-input" type="number" placeholder="Enter a number" />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <input type="checkbox" id="checkbox" className="h-4 w-4" />
                  <Label htmlFor="checkbox">Check this box</Label>
                </div>
              </TabsContent>
              
              <TabsContent value="lists" className="space-y-4">
                <h3 className="font-medium">Test List Interactions</h3>
                <ul className="space-y-2">
                  {["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"].map((item) => (
                    <li key={item} className="flex justify-between p-2 border rounded hover:bg-slate-100">
                      <span>{item}</span>
                      <Button variant="ghost" size="sm">Select</Button>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

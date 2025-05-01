
import { useState } from "react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TranslateExistingData from "@/components/TranslateExistingData";

const Settings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const clearLocalStorage = () => {
    setIsLoading(true);
    setTimeout(() => {
      localStorage.clear();
      setIsLoading(false);
      toast({
        title: "Local storage cleared",
        description: "All local data has been cleared successfully.",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header title="Settings" showBackButton={true} />
      
      <div className="flex-1 p-4 pb-24">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="translations">Translations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6">
            <div className="bg-card rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium">Language</h3>
              <LanguageSwitcher />
            </div>
            
            <div className="bg-card rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium">Storage</h3>
              <p className="text-sm text-muted-foreground">
                Clear all locally stored data. This will not affect server data.
              </p>
              <Button 
                variant="destructive" 
                onClick={clearLocalStorage} 
                disabled={isLoading}
              >
                {isLoading ? "Clearing..." : "Clear Local Storage"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="translations" className="space-y-6">
            <div className="bg-card rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium">Translate Existing Data</h3>
              <p className="text-sm text-muted-foreground">
                Use this utility to translate all existing task templates and steps
                to supported languages (Hindi and Kannada).
              </p>
              <TranslateExistingData />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default Settings;

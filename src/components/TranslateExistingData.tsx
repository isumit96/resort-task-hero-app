
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TranslateExistingData = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [dataType, setDataType] = useState<string>("");
  const { toast } = useToast();

  const handleTranslate = async () => {
    try {
      setIsTranslating(true);
      
      const { error } = await supabase.functions.invoke("translate-existing-data", {
        body: { type: dataType || undefined }
      });

      if (error) throw error;

      toast({
        title: "Translation Complete",
        description: "All existing data has been translated successfully.",
      });
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "Translation Error",
        description: "Failed to translate existing data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Translate Existing Data</CardTitle>
        <CardDescription>
          Translate all existing task templates and steps to supported languages
          (Hindi and Kannada).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Data Type</label>
            <Select value={dataType} onValueChange={setDataType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose what to translate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Data Types</SelectItem>
                <SelectItem value="task_templates">Task Templates Only</SelectItem>
                <SelectItem value="template_steps">Template Steps Only</SelectItem>
                <SelectItem value="tasks">Tasks Only</SelectItem>
                <SelectItem value="task_steps">Task Steps Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleTranslate} 
          disabled={isTranslating}
          className="w-full"
        >
          {isTranslating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Translating...
            </>
          ) : (
            "Start Translation"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TranslateExistingData;

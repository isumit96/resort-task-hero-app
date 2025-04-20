
import Header from "@/components/Header";

interface LoadingStateProps {
  title?: string;
}

const LoadingState = ({ title = "Loading..." }: LoadingStateProps) => {
  return (
    <div className="h-screen flex flex-col">
      <Header showBackButton title={title} />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium">Loading content...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;

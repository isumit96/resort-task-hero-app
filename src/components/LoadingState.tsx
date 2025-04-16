
import Header from "@/components/Header";

interface LoadingStateProps {
  title?: string;
}

const LoadingState = ({ title = "Loading..." }: LoadingStateProps) => {
  return (
    <div className="h-screen flex flex-col">
      <Header showBackButton title={title} />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingState;

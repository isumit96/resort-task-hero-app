
import Header from "@/components/Header";

interface ErrorStateProps {
  title?: string;
  error: Error;
}

const ErrorState = ({ title = "Error", error }: ErrorStateProps) => {
  return (
    <div className="h-screen flex flex-col">
      <Header showBackButton title={title} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading data</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;

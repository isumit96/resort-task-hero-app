
import Header from "@/components/Header";
import { useTranslation } from "react-i18next";

interface ErrorStateProps {
  title?: string;
  error: Error;
}

const ErrorState = ({ title = "Error", error }: ErrorStateProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="h-screen flex flex-col">
      <Header showBackButton title={title} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{t('errors.loadingData')}</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;

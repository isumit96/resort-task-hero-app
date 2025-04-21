
import { FC } from "react";
import { Building } from "lucide-react";
import { DepartmentType } from "@/types";

type Props = {
  department?: DepartmentType | string | null;
  className?: string;
};

const DepartmentLabel: FC<Props> = ({ department, className }) => {
  if (!department) return null;
  return (
    <div className={`flex items-center gap-1 ${className || ""}`}>
      <Building size={16} className="text-primary" aria-label="Department" />
      <span className="text-xs font-medium text-foreground">{department}</span>
    </div>
  );
};

export default DepartmentLabel;


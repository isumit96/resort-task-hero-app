
import { useRef, memo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskStepDraggableProps {
  children: React.ReactNode;
  index: number;
  moveStep: (dragIndex: number, hoverIndex: number) => void;
  onRemove?: () => void;
}

type DragItem = {
  index: number;
  id: string;
  type: string;
};

const TaskStepDraggable = memo(({ children, index, moveStep, onRemove }: TaskStepDraggableProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const itemType = 'STEP';

  const [{ handlerId }, drop] = useDrop({
    accept: itemType,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveStep(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: itemType,
    item: () => {
      return { index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div 
      ref={preview}
      className={cn(
        "relative border rounded-lg p-4",
        isDragging ? "opacity-50 border-dashed border-primary" : ""
      )}
      data-handler-id={handlerId}
    >
      <div className="flex justify-between items-center mb-3">
        <div 
          ref={ref} 
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical size={16} className="text-muted-foreground" />
        </div>
        
        {onRemove && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRemove} 
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <X size={16} />
            <span className="sr-only">Remove</span>
          </Button>
        )}
      </div>
      {children}
    </div>
  );
});

TaskStepDraggable.displayName = "TaskStepDraggable";

export default TaskStepDraggable;

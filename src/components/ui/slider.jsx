import * as React from "react"
import { cn } from "../../lib/utils"

const Slider = React.forwardRef(
  ({ className, min = 0, max = 100, step = 1, value, onValueChange, ...props }, ref) => {
    const [values, setValues] = React.useState(value || [min]);
    const sliderRef = React.useRef(null);
    
    React.useEffect(() => {
      if (value !== undefined) {
        setValues(Array.isArray(value) ? value : [value]);
      }
    }, [value]);
    
    const handleChange = (event) => {
      const rect = sliderRef.current.getBoundingClientRect();
      const position = (event.clientX - rect.left) / rect.width;
      const newValue = min + Math.round((position * (max - min)) / step) * step;
      const clampedValue = Math.max(min, Math.min(max, newValue));
      
      const newValues = [clampedValue];
      setValues(newValues);
      
      if (onValueChange) {
        onValueChange(newValues);
      }
    };
    
    const percentage = ((values[0] - min) / (max - min)) * 100;
    
    return (
      <div
        ref={sliderRef}
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        onClick={handleChange}
        {...props}
      >
        <div className="relative h-2 w-full rounded-full bg-muted">
          <div
            className="absolute h-full rounded-full bg-primary"
            style={{ width: `${percentage}%` }}
          />
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background ring-offset-background"
            style={{ left: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider }
import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

const Select = React.forwardRef(({ children, value, onValueChange, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(value);
  const selectRef = React.useRef(null);
  
  React.useEffect(() => {
    setSelectedValue(value);
  }, [value]);
  
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleValueChange = (value) => {
    setSelectedValue(value);
    if (onValueChange) {
      onValueChange(value);
    }
    setOpen(false);
  };
  
  return (
    <div 
      ref={selectRef}
      className="relative"
      {...props}
    >
      {React.Children.map(children, child => {
        if (child.type.displayName === "SelectTrigger") {
          return React.cloneElement(child, {
            open,
            onClick: () => setOpen(!open),
            value: selectedValue
          });
        }
        if (child.type.displayName === "SelectContent") {
          return open ? React.cloneElement(child, {
            value: selectedValue,
            onValueChange: handleValueChange
          }) : null;
        }
        return child;
      })}
    </div>
  );
});
Select.displayName = "Select";

const SelectTrigger = React.forwardRef(({ className, children, open, value, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {React.Children.map(children, child => {
      if (child?.type?.displayName === "SelectValue") {
        return React.cloneElement(child, { value });
      }
      return child;
    })}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </button>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ className, placeholder, value, ...props }) => (
  <span
    className={cn("text-sm", className)}
    {...props}
  >
    {value || placeholder}
  </span>
);
SelectValue.displayName = "SelectValue";

const SelectContent = React.forwardRef(({ className, children, value, onValueChange, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background p-1 text-foreground shadow-md",
      className
    )}
    {...props}
  >
    {React.Children.map(children, child => {
      return React.cloneElement(child, {
        value,
        onValueChange
      });
    })}
  </div>
));
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef(({ className, children, value: itemValue, value: selectedValue, onValueChange, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      itemValue === selectedValue ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground",
      className
    )}
    onClick={() => onValueChange(itemValue)}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {itemValue === selectedValue && (
        <div className="h-2 w-2 rounded-full bg-current"/>
      )}
    </span>
    {children}
  </div>
));
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
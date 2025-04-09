import * as React from "react"
import { cn } from "../../lib/utils"

const Tabs = ({ defaultValue, value, onValueChange, children, ...props }) => {
  const [selected, setSelected] = React.useState(value || defaultValue);
  
  React.useEffect(() => {
    if (value !== undefined) {
      setSelected(value);
    }
  }, [value]);
  
  const handleValueChange = (newValue) => {
    setSelected(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };
  
  return (
    <div {...props}>
      {React.Children.map(children, child => {
        return React.cloneElement(child, {
          value: selected,
          onValueChange: handleValueChange
        });
      })}
    </div>
  );
};

const TabsList = ({ className, children, value, onValueChange, ...props }) => {
  return (
    <div 
      className={cn("flex space-x-2 mb-4", className)} 
      {...props}
    >
      {React.Children.map(children, child => {
        return React.cloneElement(child, {
          value,
          onValueChange
        });
      })}
    </div>
  );
};

const TabsTrigger = ({ className, value: tabValue, children, value: selectedValue, onValueChange, ...props }) => {
  const isActive = tabValue === selectedValue;
  
  return (
    <button
      className={cn(
        "px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-muted-foreground hover:bg-muted/80",
        className
      )}
      onClick={() => onValueChange(tabValue)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ className, value: tabValue, children, value: selectedValue, ...props }) => {
  if (tabValue !== selectedValue) return null;
  
  return (
    <div 
      className={cn("mt-2", className)} 
      {...props}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent }
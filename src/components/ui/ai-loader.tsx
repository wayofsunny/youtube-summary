import { type FC } from "react";

interface AILoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const AILoader = ({ 
  text = "Generating", 
  size = "md", 
  className = "" 
}: AILoaderProps) => {
  const sizeClasses = {
    sm: "text-lg gap-1",
    md: "text-2xl gap-1", 
    lg: "text-3xl gap-2"
  };

  const loaderSizes = {
    sm: "w-6 h-6 ml-3",
    md: "w-8 h-8 ml-4",
    lg: "w-12 h-12 ml-6"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`loader-wrapper ${sizeClasses[size]}`}>
        {text.split('').map((letter, index) => (
          <span 
            key={index} 
            className="loader-letter"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter}
          </span>
        ))}
        <div className={`loader ${loaderSizes[size]}`}></div>
      </div>
    </div>
  );
};

// Keep the old export for backward compatibility
export const Component = AILoader;

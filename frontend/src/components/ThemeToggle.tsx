import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeContextBridge } from "@/components/ThemeContextBridge";
import { Sun, Moon, Monitor, Palette } from "lucide-react";

const ThemeToggle = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
        <div className="w-4 h-4" />
      </Button>
    );
  }

  const getThemeIcon = (currentTheme: string | undefined) => {
    switch (currentTheme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'system':
        return <Monitor className="w-4 h-4" />;
      default:
        return systemTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />;
    }
  };

  const themes = [
    {
      name: 'Light',
      value: 'light',
      icon: Sun,
      description: 'Clean and bright interface'
    },
    {
      name: 'Dark',
      value: 'dark', 
      icon: Moon,
      description: 'Easy on the eyes in low light'
    },
    {
      name: 'System',
      value: 'system',
      icon: Monitor,
      description: 'Adapts to your system preference'
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-9 h-9 p-0 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <div className="transition-transform duration-200 hover:rotate-12">
            {getThemeIcon(theme)}
          </div>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <ThemeContextBridge>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
              <Palette className="w-4 h-4" />
              Choose Theme
            </div>
            <p className="text-xs text-muted-foreground">
              Select your preferred interface theme
            </p>
          </div>
          <div className="h-px bg-border my-1" />
          {themes.map((themeOption) => {
            const IconComponent = themeOption.icon;
            const isSelected = theme === themeOption.value;
            
            return (
              <DropdownMenuItem
                key={themeOption.value}
                onClick={() => setTheme(themeOption.value)}
                className={`cursor-pointer transition-colors duration-200 ${
                  isSelected 
                    ? 'bg-primary/10 text-primary font-medium' 
                    : 'hover:bg-accent/50'
                }`}
              >
                <div className="flex items-center w-full gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                    isSelected 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {themeOption.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {themeOption.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </ThemeContextBridge>
    </DropdownMenu>
  );
};

export default ThemeToggle;
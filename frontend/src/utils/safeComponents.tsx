import React from 'react';

// React-specific safety utilities
export const createSafeComponent = <P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
) => {
  const SafeComponent = (props: P) => {
    const [hasError, setHasError] = React.useState(false);
    const mountedRef = React.useRef(true);

    React.useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
      };
    }, []);

    React.useEffect(() => {
      if (hasError) {
        const timer = setTimeout(() => {
          if (mountedRef.current) {
            setHasError(false);
          }
        }, 1000);
        return () => clearTimeout(timer);
      }
    }, [hasError]);

    if (hasError) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Component temporarily unavailable</p>
        </div>
      );
    }

    try {
      return <Component {...props} />;
    } catch (error) {
      console.error(`Error in ${displayName || 'SafeComponent'}:`, error);
      if (mountedRef.current) {
        setHasError(true);
      }
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      );
    }
  };

  SafeComponent.displayName = displayName || `Safe(${Component.displayName || Component.name})`;
  return SafeComponent;
};

// Cleanup utilities for useEffect
export const createCleanupEffect = (
  effect: () => void | (() => void),
  deps: React.DependencyList
) => {
  return React.useEffect(() => {
    let cleanup: (() => void) | void;
    let isMounted = true;

    try {
      cleanup = effect();
    } catch (error) {
      console.error('Effect error:', error);
    }

    return () => {
      isMounted = false;
      if (cleanup && typeof cleanup === 'function') {
        try {
          cleanup();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      }
    };
  }, deps);
};
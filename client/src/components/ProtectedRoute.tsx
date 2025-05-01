import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <Route path={path}>
      {(params) => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!isAuthenticated) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
              <h2 className="text-2xl font-bold">Authentication Required</h2>
              <p className="text-muted-foreground">Please log in to access this page</p>
              <Button 
                className="mt-4" 
                onClick={() => {
                  // Use a form-based POST to avoid cross-origin issues
                  const form = document.createElement('form');
                  form.method = 'GET';
                  form.action = '/api/login';
                  document.body.appendChild(form);
                  form.submit();
                }}
              >
                Log in with Replit
              </Button>
            </div>
          );
        }

        return <Component {...params} />;
      }}
    </Route>
  );
}
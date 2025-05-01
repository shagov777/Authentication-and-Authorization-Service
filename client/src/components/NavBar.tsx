import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/components/UserProfile";

interface NavBarProps {
  title: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
}

export function NavBar({ title, onZoomIn, onZoomOut, onReset }: NavBarProps) {
  return (
    <div className="bg-card border-b border-border sticky top-0 z-10">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <div className="flex items-center space-x-4">
          {(onZoomIn || onZoomOut || onReset) && (
            <>
              {onZoomIn && (
                <Button variant="ghost" size="sm" onClick={onZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              )}
              {onZoomOut && (
                <Button variant="ghost" size="sm" onClick={onZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              )}
              {onReset && (
                <Button variant="ghost" size="sm" onClick={onReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
          <UserProfile />
        </div>
      </div>
    </div>
  );
}

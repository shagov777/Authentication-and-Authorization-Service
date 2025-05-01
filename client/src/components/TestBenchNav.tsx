import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function TestBenchNav() {
  const { user, isLoading } = useAuth();

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">Database Schema Manager</h1>
            <p className="text-sm text-muted-foreground">Visualize and manage your PostgreSQL schema</p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">Schema Viewer</Button>
            </Link>
            <Link href="/test-bench">
              <Button variant="outline">Auth Test Bench</Button>
            </Link>
            {user ? (
              <Button variant="default" onClick={() => {}}>
                Logged in as {user.username}
              </Button>
            ) : (
              <Link href="/auth">
                <Button variant="default">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
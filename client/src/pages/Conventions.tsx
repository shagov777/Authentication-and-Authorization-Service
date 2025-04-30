import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Conventions() {
  return (
    <Card>
      <CardHeader className="bg-primary text-primary-foreground py-3">
        <CardTitle className="text-lg">Naming Conventions</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium text-foreground mb-2">Tables</h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Use lowercase_snake_case for table names</li>
              <li>Prefix sensitive module tables with short namespaces (e.g., auth_, profile_, wallet_)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-foreground mb-2">Columns</h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Always use lowercase_snake_case</li>
              <li>Primary keys should always be named id</li>
              <li>Foreign keys should end with _id (e.g., user_id, wallet_id)</li>
              <li>Standard timestamps: created_at, updated_at, deleted_at (for soft deletes)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-foreground mb-2">Keys/Indexes</h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Index frequently used fields</li>
              <li>Index columns such as user_id, email, username, and any transactional fields frequently queried</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-foreground mb-2">Data Types</h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>UUID for all IDs if possible: Use UUIDs as the primary key type for uniqueness and scalability</li>
              <li>TIMESTAMP WITH TIMEZONE for all date fields: This ensures time is stored accurately, especially in multi-jurisdictional systems</li>
              <li>VARCHAR(255): Use this for text fields (email, username, etc.) unless longer text fields are required</li>
              <li>JSONB: Use JSONB for flexible fields like settings, preferences, and metadata</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-foreground mb-2">Security</h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Password hashing: Always use strong hashing algorithms like bcrypt or argon2</li>
              <li>Encrypt sensitive fields: Fields containing KYC documents, payment methods, or any sensitive data should be encrypted</li>
              <li>Soft delete wherever possible: Avoid physically deleting data in tables that hold important user information. Instead, use a deleted_at column for soft deletes</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-foreground mb-2">Multi-Currency Support</h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>The preferred_currency field in user_auth ensures users can set their default currency</li>
              <li>The currency field in auth_sessions allows for session-based currency preferences</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-foreground mb-2">Scalability Considerations</h4>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>The schema is designed for large user bases and scalability, particularly through the use of UUIDs as primary keys, indexing, and optimized queries for user authentication and session management</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Loader2, Database, Lock, User } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // Login form state
  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: ""
  });

  // Login form handler
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  // Register form handler
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
  };

  // Login form submission
  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation.mutate({
      username: loginData.username,
      password: loginData.password
    });
  };

  // Register form submission
  const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate password match
    if (registerData.password !== registerData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    registerMutation.mutate({
      username: registerData.username,
      email: registerData.email,
      password: registerData.password,
      fullName: registerData.fullName || undefined
    });
  };

  // Redirect if user is already logged in
  if (user && !isLoading) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Left side: Auth form */}
      <div className="flex items-center justify-center w-full lg:w-1/2 p-8">
        <div className="w-full max-w-md">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Login to access the database schema visualization tool.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLoginSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="username"
                          name="username"
                          placeholder="Your username"
                          className="pl-10"
                          value={loginData.username}
                          onChange={handleLoginChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="password"
                          name="password"
                          type="password"
                          placeholder="Your password"
                          className="pl-10"
                          value={loginData.password}
                          onChange={handleLoginChange}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Register to gain access to the database visualization tool.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegisterSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">Username</Label>
                      <Input 
                        id="reg-username"
                        name="username"
                        placeholder="Choose a username"
                        value={registerData.username}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Your email address"
                        value={registerData.email}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name (Optional)</Label>
                      <Input 
                        id="fullName"
                        name="fullName"
                        placeholder="Your full name"
                        value={registerData.fullName}
                        onChange={handleRegisterChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input 
                        id="reg-password"
                        name="password"
                        type="password"
                        placeholder="Create a password"
                        value={registerData.password}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input 
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={registerData.confirmPassword}
                        onChange={handleRegisterChange}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right side: Hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-r from-primary/20 to-primary/10 flex-col items-center justify-center text-center p-12">
        <div className="max-w-xl">
          <Database className="h-24 w-24 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Database Schema Visualization Tool
          </h1>
          <p className="text-lg mb-8">
            An interactive tool for exploring, understanding, and documenting complex database schemas.
            Visualize relationships, generate SQL, and follow best practices for database design.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
            <div className="flex items-start space-x-2">
              <div className="bg-primary/20 p-2 rounded-full">
                <div className="h-4 w-4 rounded-full bg-primary" />
              </div>
              <div>
                <h3 className="font-medium">Interactive Diagrams</h3>
                <p className="text-sm text-muted-foreground">Visualize your database structure</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="bg-primary/20 p-2 rounded-full">
                <div className="h-4 w-4 rounded-full bg-primary" />
              </div>
              <div>
                <h3 className="font-medium">SQL Generation</h3>
                <p className="text-sm text-muted-foreground">Create implementation scripts</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="bg-primary/20 p-2 rounded-full">
                <div className="h-4 w-4 rounded-full bg-primary" />
              </div>
              <div>
                <h3 className="font-medium">Modular Design</h3>
                <p className="text-sm text-muted-foreground">Organize by business domain</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="bg-primary/20 p-2 rounded-full">
                <div className="h-4 w-4 rounded-full bg-primary" />
              </div>
              <div>
                <h3 className="font-medium">Best Practices</h3>
                <p className="text-sm text-muted-foreground">Follow database design standards</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
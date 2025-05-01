import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import TestBenchNav from "@/components/TestBenchNav";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Define form schemas
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleId: z.string().transform(val => parseInt(val, 10)),
});

// Define interface for Role and User
interface Role {
  id: number;
  name: string;
  description?: string;
}

interface User {
  id: number;
  username: string;
  email: string | null;
  roleId: number | null;
  isActive: boolean | null;
}

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function TestBench() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Create forms
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      roleId: 2, // Default to regular user role
    },
  });

  // Fetch roles
  const {
    data: roles = [] as Role[],
    isLoading: rolesLoading,
    error: rolesError,
  } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch users
  const {
    data: users = [] as User[],
    isLoading: usersLoading,
    error: usersError,
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user, // Only fetch if user is logged in
  });

  // Define login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const res = await apiRequest("POST", "/api/login", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Define register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      const res = await apiRequest("POST", "/api/register", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Registration successful",
        description: `Welcome, ${data.username}!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Define logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout", {});
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Logout failed");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Logout successful",
        description: "You have been logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Find role name by ID
  const getRoleName = (roleId: number | null) => {
    if (!roleId) return "Unknown";
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : "Unknown";
  };

  return (
    <div className="container max-w-6xl mx-auto p-4">
      <TestBenchNav />
      <h1 className="text-2xl font-bold mb-6">Authentication Test Bench</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Authentication Forms */}
        <div>
          {user ? (
            <Card>
              <CardHeader>
                <CardTitle>Currently Logged In</CardTitle>
                <CardDescription>You are logged in as a user</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Username:</span> {user.username}
                  </div>
                  {user.email && (
                    <div>
                      <span className="font-semibold">Email:</span> {user.email}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Role:</span>{" "}
                    <Badge>{getRoleName(user.roleId)}</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleLogout} variant="destructive">
                  Logout
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Login Form</CardTitle>
                    <CardDescription>
                      Login with your username and password
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form
                        onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="johndoe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="******"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Logging in..." : "Login"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <Button
                      variant="ghost"
                      onClick={() => setActiveTab("register")}
                    >
                      Don't have an account? Register
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Register Form</CardTitle>
                    <CardDescription>
                      Create a new account to access the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form
                        onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="johndoe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="john@example.com"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="******"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="roleId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {rolesLoading ? (
                                    <SelectItem value="loading">
                                      Loading roles...
                                    </SelectItem>
                                  ) : rolesError ? (
                                    <SelectItem value="error">
                                      Error loading roles
                                    </SelectItem>
                                  ) : (
                                    roles.map((role) => (
                                      <SelectItem
                                        key={role.id}
                                        value={role.id.toString()}
                                      >
                                        {role.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Select your access level
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending
                            ? "Registering..."
                            : "Register"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <Button
                      variant="ghost"
                      onClick={() => setActiveTab("login")}
                    >
                      Already have an account? Login
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* User Database */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>User Database</CardTitle>
              <CardDescription>
                View all registered users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user ? (
                <div className="text-center p-4 border rounded-md bg-muted">
                  <p>Log in to view the user database</p>
                </div>
              ) : usersLoading ? (
                <div className="text-center p-4">Loading users...</div>
              ) : usersError ? (
                <div className="text-center p-4 text-red-500">
                  Error loading users
                </div>
              ) : (
                <Table>
                  <TableCaption>List of all registered users</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No users registered yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getRoleName(user.roleId)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.isActive ? "success" : "destructive"}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
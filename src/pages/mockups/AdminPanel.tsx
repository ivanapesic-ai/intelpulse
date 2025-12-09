import { useState } from "react";
import { ArrowLeft, Plus, RefreshCw, Users, BarChart3, Database, Trash2, Edit, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface User {
  id: string;
  email: string;
  organization: string;
  accessUntil: string;
  status: "active" | "expired" | "pending";
  lastLogin?: string;
}

interface DataSource {
  id: string;
  name: string;
  type: "api" | "csv" | "document";
  lastRefresh: string;
  status: "healthy" | "error" | "pending";
  recordCount: number;
}

const sampleUsers: User[] = [
  { id: "1", email: "marie.curie@eu-authority.gov", organization: "EU Transport Agency", accessUntil: "2025-06-01", status: "active", lastLogin: "2024-12-08" },
  { id: "2", email: "hans.schmidt@mobility.de", organization: "German Mobility Institute", accessUntil: "2025-03-15", status: "active", lastLogin: "2024-12-07" },
  { id: "3", email: "anna.kowalski@research.pl", organization: "Polish Research Center", accessUntil: "2024-11-30", status: "expired" },
  { id: "4", email: "jean.dupont@transport.fr", organization: "French Transport Ministry", accessUntil: "2025-12-01", status: "pending" },
];

const sampleDataSources: DataSource[] = [
  { id: "1", name: "Dealroom API", type: "api", lastRefresh: "2024-12-01", status: "healthy", recordCount: 1250 },
  { id: "2", name: "PATSTAT/EPO", type: "csv", lastRefresh: "2024-11-15", status: "healthy", recordCount: 8420 },
  { id: "3", name: "CEI Documents", type: "document", lastRefresh: "2024-10-20", status: "pending", recordCount: 156 },
  { id: "4", name: "EU Horizon", type: "api", lastRefresh: "2024-12-01", status: "healthy", recordCount: 342 },
];

const statusColors = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  expired: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  healthy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  error: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

export default function AdminPanel() {
  const [users, setUsers] = useState(sampleUsers);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshProgress(0);
    
    const interval = setInterval(() => {
      setRefreshProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRefreshing(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const activeUsers = users.filter((u) => u.status === "active").length;
  const totalRecords = sampleDataSources.reduce((sum, ds) => sum + ds.recordCount, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/mockups">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">BluSpecs Staff Portal</p>
            </div>
          </div>
          <Badge variant="outline" className="text-primary border-primary">
            Admin Access
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-3xl font-bold">{activeUsers}</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="text-3xl font-bold">{totalRecords.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Database className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Data Sources</p>
                  <p className="text-3xl font-bold">{sampleDataSources.length}</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Refresh</p>
                  <p className="text-3xl font-bold">Dec 1</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <RefreshCw className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="data">Data Refresh</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Premium Users</CardTitle>
                  <CardDescription>Manage access for contracted clients</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Email</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Organization</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Access Until</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Last Login</th>
                        <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="p-3 text-sm font-medium">{user.email}</td>
                          <td className="p-3 text-sm text-muted-foreground">{user.organization}</td>
                          <td className="p-3 text-sm text-muted-foreground">{user.accessUntil}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={statusColors[user.status]}>
                              {user.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">{user.lastLogin || "Never"}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Refresh Tab */}
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Data Sources</CardTitle>
                  <CardDescription>Manage external data integrations</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh All"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {isRefreshing && (
                  <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Refreshing data sources...</span>
                      <span>{refreshProgress}%</span>
                    </div>
                    <Progress value={refreshProgress} className="h-2" />
                  </div>
                )}
                
                <div className="space-y-3">
                  {sampleDataSources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                          <Database className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{source.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {source.recordCount.toLocaleString()} records • Last refresh: {source.lastRefresh}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={statusColors[source.status]}>
                          {source.status}
                        </Badge>
                        <Badge variant="outline" className="text-muted-foreground">
                          {source.type.toUpperCase()}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Usage This Month</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Page Views</span>
                    <span className="font-semibold">2,847</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Unique Visitors</span>
                    <span className="font-semibold">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Exports Generated</span>
                    <span className="font-semibold">42</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg. Session Duration</span>
                    <span className="font-semibold">8m 32s</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Technologies Viewed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Kubernetes", views: 342 },
                    { name: "Edge AI", views: 287 },
                    { name: "V2X Protocols", views: 234 },
                    { name: "Computer Vision", views: 198 },
                    { name: "Digital Twin", views: 156 },
                  ].map((tech, i) => (
                    <div key={tech.name} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-sm flex-1">{tech.name}</span>
                      <span className="text-sm font-medium">{tech.views}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

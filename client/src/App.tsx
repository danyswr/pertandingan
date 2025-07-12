import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastContainer } from "@/components/ui/toast-notifications";
import { Sidebar } from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import Athletes from "@/pages/athletes";
import Categories from "@/pages/categories";
import Tournament from "@/pages/tournament";
import AntiClash from "@/pages/anti-clash";
import Reports from "@/pages/reports";

import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex min-h-screen bg-tkd-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/athletes" component={Athletes} />
          <Route path="/categories" component={Categories} />
          <Route path="/matches" component={Tournament} />
          <Route path="/anti-clash" component={AntiClash} />
          <Route path="/reports" component={Reports} />

          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastContainer />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

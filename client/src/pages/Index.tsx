import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import { Button } from "@/components/ui/button";
import AboutSection from "@/components/AboutSection";
import Dashboard from "@/components/Dashboard";
import TaskCard from "@/components/TaskCard";
import ClubCard from "@/components/ClubCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  Users, 
  Zap, 
  Heart,
  Globe,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

// Mock data for demonstration
const mockTasks = [
  {
    id: 1,
    title: "Design promotional poster for upcoming event",
    description: "Create an eye-catching poster for the annual drama festival featuring African themes and vibrant colors.",
    club: "Drama Club",
    assignedTo: { name: "Sarah Kiprotich", initials: "SK" },
    dueDate: "Dec 15, 2024",
    priority: "high" as const,
    status: "in-progress" as const,
    progress: 65,
    comments: 3,
    tags: ["Design", "Marketing", "Event"]
  },
  {
    id: 2,
    title: "Organize community outreach program",
    description: "Plan and coordinate a community service initiative to support local schools with educational materials.",
    club: "Student Council",
    assignedTo: { name: "James Wanjiku", initials: "JW" },
    dueDate: "Dec 20, 2024",
    priority: "medium" as const,
    status: "pending" as const,
    progress: 0,
    comments: 7,
    tags: ["Community", "Education", "Outreach"]
  }
];

const mockClubs = [
  {
    id: 1,
    name: "Drama Club",
    description: "Bringing stories to life through powerful performances and creative expression, showcasing the rich cultural heritage of our community.",
    members: [
      { name: "Sarah Kiprotich", initials: "SK", role: "President" },
      { name: "Michael Ochieng", initials: "MO", role: "Director" },
      { name: "Grace Muthoni", initials: "GM", role: "Member" },
      { name: "David Kimani", initials: "DK", role: "Member" },
      { name: "Lucy Wanjiru", initials: "LW", role: "Member" }
    ],
    totalTasks: 12,
    completedTasks: 8,
    activeTasks: 4,
    completionRate: 85,
    category: "Cultural",
    lastActivity: "2 hours ago",
    isOwner: true
  },
  {
    id: 2,
    name: "Student Council",
    description: "Leading positive change in our university community through democratic governance and student advocacy.",
    members: [
      { name: "James Wanjiku", initials: "JW", role: "President" },
      { name: "Anne Njeri", initials: "AN", role: "Secretary" },
      { name: "Peter Otieno", initials: "PO", role: "Treasurer" }
    ],
    totalTasks: 15,
    completedTasks: 10,
    activeTasks: 5,
    completionRate: 70,
    category: "Academic",
    lastActivity: "1 day ago",
    isOwner: false
  }
];

const Index = () => {
  const [currentView, setCurrentView] = useState<"landing" | "dashboard" | "tasks" | "clubs">("landing");
  const { toast } = useToast();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const { isAuthenticated } = useAuth();

  const openAuthModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleTaskStatusChange = (taskId: number, newStatus: string) => {
    toast({
      title: "Task Updated",
      description: `Task status changed to ${newStatus}`,
    });
  };

  const handleClubManage = (clubId: number) => {
    toast({
      title: "Club Management",
      description: "Opening club management panel...",
    });
  };

  const handleClubJoin = (clubId: number) => {
    toast({
      title: "Joining Club",
      description: "Sending join request...",
    });
  };

  if (currentView === "dashboard") {
    return (
      <div>
        <Navbar />
        <Dashboard />
      </div>
    );
  }

  if (currentView === "tasks") {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-background pt-20 pb-8">
          <div className="container mx-auto px-4 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-foreground">Tasks</h1>
                <p className="text-muted-foreground mt-2">Manage and track all your assigned tasks</p>
              </div>
              <Button variant="gradient" onClick={() => setCurrentView("dashboard")}>
                Back to Dashboard
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleTaskStatusChange}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "clubs") {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-background pt-20 pb-8">
          <div className="container mx-auto px-4 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-foreground">Clubs</h1>
                <p className="text-muted-foreground mt-2">Discover and manage your club memberships</p>
              </div>
              <Button variant="gradient" onClick={() => setCurrentView("dashboard")}>
                Back to Dashboard
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockClubs.map((club) => (
                <ClubCard 
                  key={club.id} 
                  club={club} 
                  onManage={handleClubManage}
                  onJoin={handleClubJoin}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <Navbar onAuthClick={openAuthModal} />
      <HeroSection onAuthClick={openAuthModal} />
      <FeaturesSection />
      <AboutSection />
      {/* Demo Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-foreground">Experience Harambee Hub</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how our platform transforms community collaboration with real examples
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              variant="gradient" 
              size="lg" 
              onClick={() => setCurrentView("dashboard")}
              className="group h-auto p-6 flex-col space-y-2"
            >
              <Target className="h-8 w-8" />
              <span className="text-lg font-semibold">View Dashboard</span>
              <span className="text-sm opacity-90">See your productivity overview</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setCurrentView("tasks")}
              className="group h-auto p-6 flex-col space-y-2 hover:bg-primary/5"
            >
              <Zap className="h-8 w-8" />
              <span className="text-lg font-semibold">Explore Tasks</span>
              <span className="text-sm opacity-70">Interactive task management</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setCurrentView("clubs")}
              className="group h-auto p-6 flex-col space-y-2 hover:bg-primary/5"
            >
              <Users className="h-8 w-8" />
              <span className="text-lg font-semibold">Browse Clubs</span>
              <span className="text-sm opacity-70">Community collaboration hubs</span>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold">
            {isAuthenticated ? 'Ready to Explore More?' : 'Ready to Transform Your Community?'}
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            {isAuthenticated 
              ? 'Discover new communities or manage your existing ones.'
              : 'Join thousands of clubs already using Harambee Hub to achieve amazing results together.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link to="/discover-clubs">
                  <Button variant="hero" size="lg">
                    Discover Clubs
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/clubs">
                  <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                    My Clubs
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button 
                  variant="hero" 
                  size="lg" 
                  onClick={() => onAuthClick('register')}
                >
                  Sign Up
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => onAuthClick('login')}
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Harambee Hub</span>
              </div>
              <p className="text-sm opacity-80">
                Empowering communities across Africa to achieve more together through digital collaboration.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Product</h3>
              <div className="space-y-2 text-sm opacity-80">
                <div>Features</div>
                <div>Pricing</div>
                <div>Enterprise</div>
                <div>Support</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Company</h3>
              <div className="space-y-2 text-sm opacity-80">
                <div>About Us</div>
                <div>Careers</div>
                <div>Blog</div>
                <div>Contact</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Connect</h3>
              <div className="space-y-2 text-sm opacity-80">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  info@harambeehub.com
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +254 700 123 456
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Kilifi, Kenya
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm opacity-80">
            <p>&copy; 2025 Harambee Hub. All rights reserved. Built with by Erick Saddam.</p>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
        onSwitchMode={(newMode) => setAuthMode(newMode)}
      />
    </div>
  );
};

export default Index;

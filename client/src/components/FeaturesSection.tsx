import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, MessageCircle, BarChart3, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Smart Task Management",
    description: "Create, assign, and track tasks with deadlines, priority levels, and progress monitoring.",
    color: "text-primary"
  },
  {
    icon: Users,
    title: "Club Organization",
    description: "Manage multiple clubs with role-based access, member invitations, and hierarchy management.",
    color: "text-accent"
  },
  {
    icon: MessageCircle,
    title: "Real-time Communication",
    description: "Comment on tasks, share updates, and collaborate seamlessly with your team members.",
    color: "text-success"
  },
  {
    icon: BarChart3,
    title: "Progress Dashboard",
    description: "Visual overview of individual and club-wide progress with insightful analytics.",
    color: "text-primary"
  },
  {
    icon: Shield,
    title: "Member Management",
    description: "Easy invitation system, role assignments, and permission controls for security.",
    color: "text-accent"
  },
  {
    icon: Zap,
    title: "Gamified Experience",
    description: "Achievement badges, progress tracking, and motivational elements to boost engagement.",
    color: "text-success"
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Everything Your Club Needs
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Harambee Hub provides all the tools your community needs to collaborate effectively, 
            stay organized, and achieve remarkable results together.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-primary/20"
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 group-hover:animate-pulse-glow transition-all duration-300">
                    <Icon className={`h-8 w-8 text-white`} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-gradient-warm rounded-3xl p-8 lg:p-12">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <div className="space-y-2">
              <div className="text-4xl lg:text-5xl font-bold">500+</div>
              <div className="text-lg opacity-90">Active Clubs</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl lg:text-5xl font-bold">10K+</div>
              <div className="text-lg opacity-90">Tasks Completed</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl lg:text-5xl font-bold">98%</div>
              <div className="text-lg opacity-90">User Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
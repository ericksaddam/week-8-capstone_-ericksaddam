import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/hero-collaboration.jpg";

const HeroSection = ({ onAuthClick }: { onAuthClick: (mode: "login" | "register") => void }) => {
  const { isAuthenticated, user } = useAuth();
  return (
    <section className="relative min-h-screen bg-gradient-warm overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-slide-up">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-foreground font-medium">
                <Zap className="mr-2 h-4 w-4 text-accent" />
                Powering Community Collaboration
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                {isAuthenticated && user ? (
                  <>
                    <span className="block text-foreground">Welcome {user.name}</span>
                    <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                      to Harambee Hub
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block text-foreground">Welcome to</span>
                    <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                      Harambee Hub
                    </span>
                  </>
                )}
              </h1>
              
              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                Where communities pull together for a common purpose. Streamline your club activities, 
                manage tasks efficiently, and achieve more together than ever before.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link to="/discover-clubs">
                    <Button variant="hero" size="lg" className="group">
                      Discover Clubs
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/clubs">
                    <Button variant="outline" size="lg">
                      My Clubs
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Button size="lg" variant="gradient" className="w-full sm:w-auto" onClick={() => onAuthClick('register')}>
                    Sign Up
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/20 border-white/30 hover:bg-white/30" onClick={() => onAuthClick('login')}>
                    Sign In
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">500+ clubs already collaborating</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-success" />
                <span className="text-sm text-muted-foreground">10,000+ tasks completed</span>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative animate-scale-in">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img 
                src={heroImage} 
                alt="People collaborating in Harambee Hub" 
                className="w-full h-[500px] lg:h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-warm animate-bounce-gentle">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-foreground">Live Collaboration</span>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-warm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">98%</div>
                <div className="text-xs text-muted-foreground">Task Completion</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
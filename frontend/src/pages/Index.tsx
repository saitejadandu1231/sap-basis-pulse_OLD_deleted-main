
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  ArrowRight, 
  CheckCircle, 
  Server, 
  Shield, 
  Zap, 
  Users, 
  BarChart3,
  HeadphonesIcon,
  Clock,
  Star,
  TrendingUp,
  Globe,
  Database,
  Settings,
  Lightbulb,
  Award,
  MessageSquare,
  ChevronRight
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: Server,
      title: "SAP BASIS Support",
      description: "Complete SAP BASIS administration and support services",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Advanced security configurations and compliance management",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      icon: Zap,
      title: "Performance Optimization",
      description: "System tuning and performance enhancement services",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      icon: Database,
      title: "Migration Services",
      description: "Seamless SAP system migrations and upgrades",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: Clock,
      title: "24/7 Monitoring",
      description: "Round-the-clock system monitoring and support",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      icon: Users,
      title: "Expert Consultants",
      description: "Certified SAP professionals at your service",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    }
  ];

  const services = [
    {
      title: "SAP RISE",
      description: "Complete SAP S/4HANA Cloud transformation",
      features: ["Cloud Migration", "System Integration", "User Training"]
    },
    {
      title: "SAP Grow",
      description: "Scalable SAP solutions for growing businesses",
      features: ["Rapid Implementation", "Cost Optimization", "Business Growth"]
    },
    {
      title: "On-Premise Support",
      description: "Traditional SAP system maintenance and support",
      features: ["System Administration", "Performance Tuning", "Technical Support"]
    }
  ];

  const stats = [
    { number: "500+", label: "Enterprise Clients", icon: Users },
    { number: "99.9%", label: "System Uptime", icon: TrendingUp },
    { number: "24/7", label: "Expert Support", icon: HeadphonesIcon },
    { number: "15+", label: "Years Experience", icon: Award }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Navigation Header */}
      <header className="fixed top-0 w-full z-50 glass-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">Y</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Yuktor
              </span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#services" className="text-muted-foreground hover:text-foreground transition-colors">Services</a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
            </nav>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {user ? (
                <Button onClick={() => navigate('/dashboard')} className="btn-glow">
                  Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/login')} className="btn-glow">
                    Get Started
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Lightbulb className="w-4 h-4 mr-2" />
              Enterprise SAP Solutions
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent mb-6 leading-tight">
              SAP BASIS
              <br />
              <span className="text-4xl md:text-6xl">Support Platform</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Professional SAP BASIS support services for enterprise organizations. 
              Expert assistance with SAP RISE, SAP Grow, migrations, and on-premise solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {user ? (
                <Button size="lg" onClick={() => navigate('/dashboard')} className="btn-glow text-lg px-8 py-4">
                  <BarChart3 className="mr-2 w-5 h-5" />
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button size="lg" onClick={() => navigate('/login')} className="btn-glow text-lg px-8 py-4">
                    <Zap className="mr-2 w-5 h-5" />
                    Start Free Trial
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="text-lg px-8 py-4">
                    <MessageSquare className="mr-2 w-5 h-5" />
                    Schedule Demo
                  </Button>
                </>
              )}
            </div>
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="flex justify-center mb-2">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                      {stat.number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Star className="w-4 h-4 mr-2" />
              Key Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything You Need for
              <span className="block text-primary">SAP Excellence</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive SAP BASIS services designed to optimize your enterprise systems and accelerate business growth.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="glass-card border-border/50 hover:border-primary/20 transition-all duration-300 group">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <IconComponent className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Globe className="w-4 h-4 mr-2" />
              Our Services
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Tailored SAP Solutions
              <span className="block text-primary">for Every Business</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="glass-card border-border/50 hover:border-primary/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl mb-2 flex items-center justify-between">
                    {service.title}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mb-6">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/5 to-blue-500/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your
            <span className="block text-primary">SAP Infrastructure?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of enterprises who trust Yuktor for their SAP BASIS needs. 
            Start your journey to optimized SAP systems today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <>
                <Button size="lg" onClick={() => navigate('/login')} className="btn-glow text-lg px-8 py-4">
                  <Zap className="mr-2 w-5 h-5" />
                  Get Started Now
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="text-lg px-8 py-4">
                  <HeadphonesIcon className="mr-2 w-5 h-5" />
                  Talk to Expert
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">Y</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Yuktor
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional SAP BASIS Support Platform.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/contact-us" className="text-muted-foreground hover:text-foreground transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms-conditions" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a href="/cancellation-refund-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                    Cancellation & Refund Policy
                  </a>
                </li>
                <li>
                  <a href="/shipping-delivery-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                    Shipping & Delivery Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Login
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8">
            <div className="text-center text-sm text-muted-foreground">
              © 2024 Yuktor. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

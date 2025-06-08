
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  PenTool, 
  BookOpen, 
  Users, 
  Sparkles, 
  Check, 
  Star,
  ArrowRight,
  Play,
  ChevronRight,
  Zap,
  Target,
  Heart,
  Shield,
  Rocket,
  Clock,
  Award,
  FileText,
  Brain,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, 25]);

  useEffect(() => {
    setIsVisible(true);
    // Check if user wants to see the tour
    const hasSeenTour = localStorage.getItem('storyforge_tour_completed');
    if (!hasSeenTour && !user) {
      setTimeout(() => setRunTour(true), 2000);
    }
  }, [user]);

  const handleGetStarted = () => {
    if (user) {
      navigate('/app/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const tourSteps: Step[] = [
    {
      target: '.hero-section',
      content: 'Welcome to StoryForge! Your AI-powered writing companion.',
    },
    {
      target: '.features-section',
      content: 'Discover powerful features designed to enhance your writing journey.',
    },
    {
      target: '.comparison-section',
      content: 'See why writers choose StoryForge over other writing tools.',
    },
    {
      target: '.use-cases-section',
      content: 'Explore real-world applications of our platform.',
    },
    {
      target: '.cta-button',
      content: 'Ready to start? Click here to begin your writing journey!',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      localStorage.setItem('storyforge_tour_completed', 'true');
      setShowFeedback(true);
    }
  };

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI Writing Assistant",
      description: "Intelligent suggestions that understand your writing style and genre."
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Story Bible",
      description: "Organize characters, plots, and world-building in one place."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Collaboration",
      description: "Share drafts and get feedback from editors and beta readers."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Smart Organization",
      description: "Auto-categorize your work with intelligent tagging and search."
    }
  ];

  const comparisons = [
    {
      feature: "AI Writing Assistance",
      us: "Advanced contextual AI",
      others: "Basic autocomplete",
      usIcon: <Sparkles className="w-5 h-5 text-green-500" />,
      othersIcon: <div className="w-5 h-5 rounded bg-gray-300" />
    },
    {
      feature: "Story Organization",
      us: "Integrated Story Bible",
      others: "Separate tools needed",
      usIcon: <BookOpen className="w-5 h-5 text-green-500" />,
      othersIcon: <div className="w-5 h-5 rounded bg-gray-300" />
    },
    {
      feature: "Collaboration",
      us: "Real-time editing",
      others: "Email attachments",
      usIcon: <Users className="w-5 h-5 text-green-500" />,
      othersIcon: <div className="w-5 h-5 rounded bg-gray-300" />
    },
    {
      feature: "Price",
      us: "Free to start",
      others: "Expensive subscriptions",
      usIcon: <Heart className="w-5 h-5 text-green-500" />,
      othersIcon: <div className="w-5 h-5 rounded bg-gray-300" />
    }
  ];

  const useCases = [
    {
      title: "Novel Writing",
      description: "Complete manuscript management from first draft to publication",
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      stats: "50,000+ novels completed"
    },
    {
      title: "Screenwriting",
      description: "Professional script formatting with industry-standard templates",
      icon: <Play className="w-8 h-8 text-purple-600" />,
      stats: "1,000+ scripts produced"
    },
    {
      title: "Academic Writing",
      description: "Research organization and citation management made easy",
      icon: <Award className="w-8 h-8 text-green-600" />,
      stats: "10,000+ papers published"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#3b82f6',
          }
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <PenTool className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                StoryForge
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm">Features</a>
              <a href="#comparison" className="text-gray-600 hover:text-gray-900 text-sm">Why Us</a>
              <a href="#use-cases" className="text-gray-600 hover:text-gray-900 text-sm">Use Cases</a>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <Button onClick={() => navigate('/app/dashboard')} size="sm">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign In</Button>
                  </Link>
                  <Button onClick={handleGetStarted} size="sm" className="cta-button">
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.8 }}
          >
            <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Writing Platform
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight">
              Write Stories That
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Captivate Hearts
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Transform your ideas into compelling narratives with AI assistance, smart organization, and collaborative tools.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="cta-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Start Writing for Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              
              <Button variant="outline" size="lg" className="group">
                <Play className="mr-2 w-4 h-4 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Free forever
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                No credit card
              </div>
            </div>
          </motion.div>
        </div>

        {/* Hero Visual - Improved Editor Preview */}
        <motion.div
          style={{ y: y1 }}
          className="max-w-5xl mx-auto mt-12 relative"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="ml-4 text-sm text-gray-300">StoryForge Editor</span>
              </div>
            </div>
            <div className="p-6 bg-gradient-to-br from-white to-blue-50/30">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-3 bg-white rounded-lg p-4 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Chapter 1: The Beginning</span>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-3 bg-gray-200 rounded"></div>
                      <div className="w-5/6 h-3 bg-gray-200 rounded"></div>
                      <div className="w-4/5 h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 mt-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-800 mb-1">AI Suggestion</p>
                          <p className="text-blue-600">Consider adding sensory details to enhance the scene's atmosphere...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Story Bible</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>Characters: 12</div>
                      <div>Locations: 8</div>
                      <div>Plot Points: 24</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Progress</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full w-3/4"></div>
                    </div>
                    <div className="text-xs text-gray-600">15,247 words</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Write Better</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="comparison-section py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Why Choose Us</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              StoryForge vs
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Other Tools</span>
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-3 gap-0">
              <div className="p-6 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-4">Feature</h3>
                {comparisons.map((item, index) => (
                  <div key={index} className="py-4 border-b border-gray-200 last:border-b-0">
                    <p className="font-medium text-gray-700">{item.feature}</p>
                  </div>
                ))}
              </div>
              
              <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-x border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  StoryForge
                </h3>
                {comparisons.map((item, index) => (
                  <div key={index} className="py-4 border-b border-blue-200 last:border-b-0">
                    <div className="flex items-center gap-2">
                      {item.usIcon}
                      <p className="font-medium text-blue-800">{item.us}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Other Tools</h3>
                {comparisons.map((item, index) => (
                  <div key={index} className="py-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center gap-2">
                      {item.othersIcon}
                      <p className="text-gray-600">{item.others}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="use-cases-section py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Use Cases</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perfect for Every
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Writing Project</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all group">
                  <CardContent className="p-8 text-center">
                    <div className="mb-6 group-hover:scale-110 transition-transform">
                      {useCase.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-4">{useCase.title}</h3>
                    <p className="text-gray-600 mb-4">{useCase.description}</p>
                    <div className="text-sm font-medium text-blue-600">{useCase.stats}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center mb-6">
              <Rocket className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Writing?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of writers who've discovered the power of AI-assisted storytelling.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleGetStarted}
                size="lg" 
                className="cta-button bg-white text-blue-600 hover:bg-gray-100"
              >
                Start Your Story Today
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-blue-600"
                onClick={() => setRunTour(true)}
              >
                Take a Tour
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <PenTool className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">StoryForge</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Empowering writers with AI-powered tools to craft compelling stories.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#comparison" className="hover:text-white">Why Us</a></li>
                <li><a href="#use-cases" className="hover:text-white">Use Cases</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 StoryForge. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">How was the tour?</h3>
            <p className="text-gray-600 mb-4">Help us improve by sharing your feedback.</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowFeedback(false)}>
                Great!
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowFeedback(false)}>
                Could be better
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;

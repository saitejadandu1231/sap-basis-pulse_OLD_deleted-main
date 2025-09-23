import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HelpCircle, BookOpen, MessageCircle, Video, Search, ExternalLink } from 'lucide-react';

const Help = () => {
  const helpSections = [
    {
      icon: BookOpen,
      title: 'Documentation',
      description: 'Browse our comprehensive guides and tutorials',
      items: [
        'Getting Started Guide',
        'Creating Support Requests',
        'Using the Messaging System',
        'Managing Your Profile',
        'Consultant Guidelines'
      ]
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides',
      items: [
        'Platform Overview (5 min)',
        'Submitting Your First Ticket (3 min)',
        'Using Real-time Chat (4 min)',
        'Understanding SAP BASIS Services (8 min)'
      ]
    },
    {
      icon: MessageCircle,
      title: 'Common Questions',
      description: 'Find answers to frequently asked questions',
      items: [
        'How do I reset my password?',
        'What SAP BASIS services are available?',
        'How long do support requests take?',
        'How do I contact a consultant directly?',
        'What file types can I upload?'
      ]
    }
  ];

  return (
    <PageLayout
      title="Help & Support"
      description="Find answers, guides, and get help with SAP BASIS Pulse"
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search for help articles, tutorials, or FAQs..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>
                Get direct help from our support team
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full">Start a Conversation</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <BookOpen className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <CardTitle>Browse Guides</CardTitle>
              <CardDescription>
                Explore our documentation library
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full">
                View All Guides
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <Video className="w-12 h-12 text-purple-500 mx-auto mb-2" />
              <CardTitle>Watch Tutorials</CardTitle>
              <CardDescription>
                Learn through video demonstrations
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full">
                View Videos
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Help Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {helpSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Icon className="w-5 h-5 mr-2 text-primary" />
                    {section.title}
                  </CardTitle>
                  <CardDescription>
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.items.map((item, index) => (
                      <li key={index}>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-between text-left h-auto p-2"
                        >
                          <span className="text-sm">{item}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
            <CardDescription>
              Our support team is here to assist you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Support Hours</h4>
                <p className="text-sm text-muted-foreground mb-1">Monday - Friday: 8:00 AM - 6:00 PM CET</p>
                <p className="text-sm text-muted-foreground mb-1">Saturday: 9:00 AM - 2:00 PM CET</p>
                <p className="text-sm text-muted-foreground">Sunday: Closed</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Emergency Support</h4>
                <p className="text-sm text-muted-foreground mb-1">For critical SAP system issues</p>
                <p className="text-sm text-muted-foreground mb-1">Available 24/7</p>
                <Button variant="outline" size="sm">Contact Emergency Support</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Help;
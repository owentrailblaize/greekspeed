'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Calendar, MessageSquare, Shield, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileService } from '@/lib/services/profileService';

interface WelcomeModalProps {
  profile: any;
  onClose: () => void;
}

export function WelcomeModal({ profile, onClose }: WelcomeModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = async () => {
    setIsClosing(true);
    
    // Mark welcome as seen in the database
    try {
      await ProfileService.updateProfile({ welcome_seen: true });
    } catch (error) {
      console.error('Error updating welcome_seen:', error);
    }
    
    onClose();
  };

  const features = [
    {
      icon: Users,
      title: "Connect with Members",
      description: "Browse and connect with fellow chapter members and alumni"
    },
    {
      icon: Calendar,
      title: "Stay Updated",
      description: "View upcoming events and chapter activities"
    },
    {
      icon: MessageSquare,
      title: "Social Feed",
      description: "Share updates and engage with the community"
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Your data is protected with enterprise-grade security"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isClosing ? 0 : 1, scale: isClosing ? 0.95 : 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="relative pb-3 md:pb-4">
            <div className="flex items-center justify-center mb-3 md:mb-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-lg md:text-2xl font-bold text-gray-900">
              Welcome to {profile?.chapter || 'Your Chapter'}!
            </CardTitle>
            <p className="text-center text-sm md:text-base text-gray-600 mt-1 md:mt-2">
              We're excited to have you join our community. Here's what you can do:
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="absolute top-2 md:top-4 right-2 md:right-4 p-1 md:p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="pt-0 px-3 md:px-6">
            {/* Features Grid - 2x2 on mobile, 2x2 on desktop */}
            <div className="grid grid-cols-2 gap-2 md:gap-4 mb-4 md:mb-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center text-center p-2 md:p-3 rounded-lg bg-gray-50"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2 md:mb-3">
                    <feature.icon className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-xs md:text-sm text-gray-900 leading-tight">
                      {feature.title}
                    </h4>
                    <p className="text-xs md:text-sm text-gray-600 leading-tight">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Get Started Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
              <div className="flex items-start space-x-2 md:space-x-3">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm md:text-base text-blue-900 mb-1">Get Started</h4>
                  <p className="text-xs md:text-sm text-blue-800 leading-relaxed">
                    Complete your profile to unlock all features and connect with other members. 
                    You can always update your information later.
                  </p>
                </div>
              </div>
            </div>

            {/* Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleClose}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 md:px-8 md:py-3 text-sm md:text-base"
                size="sm"
              >
                Let's Get Started!
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Calendar, MessageSquare, Shield, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileService } from '@/lib/services/profileService';
import Image from 'next/image';

interface WelcomeModalProps {
  profile: any;
  onClose: () => void;
  onShareIntroduction?: () => void;
  onEditProfile?: () => void;
}

export function WelcomeModal({ profile, onClose, onShareIntroduction, onEditProfile }: WelcomeModalProps) {
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

  const handleShareIntroduction = async () => {
    setIsClosing(true);
    
    // Mark welcome as seen in the database
    try {
      await ProfileService.updateProfile({ welcome_seen: true });
    } catch (error) {
      console.error('Error updating welcome_seen:', error);
    }
    
    onClose();
    
    // Trigger the introduction prompt after a short delay
    if (onShareIntroduction) {
      setTimeout(() => {
        onShareIntroduction();
      }, 300);
    }
  };

  const handleEditProfile = async () => {
    setIsClosing(true);
    
    // Mark welcome as seen in the database
    try {
      await ProfileService.updateProfile({ welcome_seen: true });
    } catch (error) {
      console.error('Error updating welcome_seen:', error);
    }
    
    onClose();
    
    // Open edit profile modal after a short delay
    if (onEditProfile) {
      setTimeout(() => {
        onEditProfile();
      }, 300);
    }
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
        <Card className="border-0 shadow-none h-full flex flex-col">
          <CardHeader className="relative pb-2 md:pb-3 flex-shrink-0">
            <div className="flex items-center justify-center mb-2 md:mb-3">
            <div
              className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 35%, #fff 100%)"
              }}
            >
              <Image 
                src="/screenshots/Artboard 13.png" 
                alt="Trailblaize" 
                width={56} 
                height={56}
                className="w-10 h-10 md:w-14 md:h-14 object-contain"
              />
            </div>
            </div>
            <CardTitle className="text-center text-base md:text-xl font-bold text-gray-900">
              Welcome to {profile?.chapter || 'Your Chapter'}!
            </CardTitle>
            <p className="text-center text-xs md:text-sm text-gray-600 mt-1">
              We're excited to have you join our community. Here's what you can do:
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="absolute top-2 md:top-3 right-2 md:right-3 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="pt-0 px-3 md:px-4 pb-3 md:pb-4 flex-1 flex flex-col">
            {/* Features Grid - Compact spacing */}
            <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center text-center p-2 rounded-lg bg-gray-50"
                >
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-accent-100 rounded-full flex items-center justify-center mb-1 md:mb-2">
                    <feature.icon className="h-3 w-3 md:h-4 md:w-4 text-brand-accent" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-medium text-xs text-gray-900 leading-tight">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-600 leading-tight">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Get Started Section - Compact */}
            <div className="bg-accent-50 border border-accent-200 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-brand-accent mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-medium text-xs md:text-sm text-accent-900">Get Started</h4>
                    <Button
                      onClick={handleEditProfile}
                      variant="ghost"
                      className="p-0 h-auto text-[10px] md:text-xs text-brand-accent hover:text-accent-700 hover:bg-transparent font-medium"
                    >
                      Complete profile <ArrowRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-accent-800 leading-relaxed">
                    Complete your profile to unlock all features and connect with other members. 
                    You can always update your information later.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons - Always at bottom */}
            <div className="flex flex-col sm:flex-row justify-center gap-2 mt-auto">
              <Button
                onClick={handleClose}
                variant="outline"
                className="px-4 py-2 md:px-6 md:py-2 text-xs md:text-sm font-medium rounded-full"
                size="sm"
              >
                Skip for now
              </Button>
              <Button
                onClick={handleShareIntroduction}
                className="bg-brand-accent hover:bg-brand-accent-hover px-4 py-2 md:px-6 md:py-2 text-xs md:text-sm font-medium rounded-full"
                size="sm"
              >
                Share an Introduction!
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

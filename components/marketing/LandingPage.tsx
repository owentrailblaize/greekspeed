'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Users, DollarSign, Shield, Star, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/supabase/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { HeroIcon } from "./icons/HeroIcon";
import { TrustedBySection } from "./TrustedBySection";

// Logo served from public directory

const features = [
  {
    icon: Users,
    title: "Alumni Network",
    description: "Connect with thousands of alumni across industries with our LinkedIn-style platform. Build meaningful relationships that last.",
    mobileDescription: "Connect with thousands of alumni across industries.",
    highlights: ["Alumni Pipeline", "Actively Hiring", "Chapter Directory"],
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    delay: 0.1,
  },
  {
    icon: DollarSign,
    title: "Dues Management",
    description: "Streamlined payment processing and financial tracking for chapter operations. Automated reminders and comprehensive reporting keep everything on track.",
    mobileDescription: "Streamlined payment processing and financial tracking.",
    highlights: ["Payment Portal", "Financial Reports", "Automated Reminders"],
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    delay: 0.2,
  },
  {
    icon: Shield,
    title: "Executive Admin",
    description: "Comprehensive administrative tools for chapter leadership and management. Role-based access ensures secure and efficient operations.",
    mobileDescription: "Comprehensive administrative tools for chapter leadership.",
    highlights: ["Role-based Access", "Task Management", "Chapter Analytics"],
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    delay: 0.3,
  },
  {
    icon: Check,
    title: "Event Coordination",
    description: "Organize and manage chapter events with ease. Track RSVPs, manage vendors, and keep everyone informed about what's happening.",
    mobileDescription: "Organize and manage chapter events with ease.",
    highlights: ["Event Planning", "Vendor Management", "RSVP Tracking"],
    color: "from-navy-500 to-navy-600",
    bgColor: "bg-navy-50",
    delay: 0.4,
  },
];

const pricingPlans = [
  {
    name: "Free - The Network",
    price: "$0",
    period: "/ month",
    description: "For individuals",
    features: [
      "Build a verified alumni profile",
      "Grow your network",
      "Maintain lifelong affiliation"
    ],
    buttonText: "Request Access",
    buttonAction: () => window.open('mailto:support@trailblaize.com?subject=Request Access', '_blank'),
    popular: false,
  },
  {
    name: "Own the Chapter",
    price: "$299",
    period: "/ month",
    description: "For chapter leaders",
    features: [
      "Claim your chapter's digital home",
      "Member & alumni management",
      "Protect your chapter's legacy"
    ],
    buttonText: "Book a demo",
    buttonAction: () => window.open('mailto:support@trailblaize.com?subject=Book a Demo', '_blank'),
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Contact Us",
    period: "",
    description: "For national organizations",
    features: [
      "Own the network at scale",
      "All chapters, one system",
      "Long-term institutional value"
    ],
    buttonText: "Contact Us",
    buttonAction: () => window.open('mailto:support@trailblaize.com?subject=Enterprise Inquiry', '_blank'),
    popular: false,
  },
];

export function LandingPage() {
  const [activeSection, setActiveSection] = useState("home");
  const { user } = useAuth();

  // Handle hash navigation on page load
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['features', 'pricing', 'about'].includes(hash)) {
      // Wait for page to render, then scroll to section
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
          setActiveSection(hash);
        }
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Use the shared header component */}
      <MarketingHeader activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Hero Section */}
      <section id="home" className="relative pt-28 md:pt-32 pb-8 md:pb-12 overflow-hidden bg-white">
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center">
            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="mb-6"
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight mb-6 instrument-serif-regular text-gray-900">
                The Alumni Network
                <br />
                for every organization.
              </h1>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="mb-10"
            >
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 leading-relaxed font-sans whitespace-normal md:whitespace-nowrap md:max-w-none">
                A shared social network where organizations own their alumni community.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex flex-row items-center justify-center gap-4 mb-12 md:mb-16 px-4"
            >
              <Button 
                size="lg" 
                className="
                  bg-black 
                  hover:bg-gray-900 
                  text-white 
                  px-6 py-3 
                  text-base 
                  font-medium 
                  font-sans
                  rounded-xl
                  transition-all duration-200 
                  whitespace-nowrap 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                "
                onClick={() => window.open('mailto:support@trailblaize.com?subject=Request a Demo', '_blank')}
              >
                Request a Demo
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="
                  border border-black 
                  bg-white 
                  text-black 
                  hover:bg-gray-50 
                  hover:border-gray-800
                  px-6 py-3 
                  text-base 
                  font-medium 
                  font-sans
                  rounded-xl
                  transition-all duration-200 
                  whitespace-nowrap 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                "
                onClick={() => window.location.href = '/sign-up'}
              >
                Join the Network
              </Button>
            </motion.div>

            {/* Trusted By Section - Inside Hero */}
            <div className="w-full mt-2 md:mt-4">
              <TrustedBySection />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - New */}
      <section className="pt-0 pb-16 md:pb-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* Two Cards with Screenshots */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6 mb-8 md:mb-16">
            {/* Card 1: System of Record */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="flex flex-col items-center gap-8 w-full max-w-[363px]"
            >
              <div className="w-full rounded-lg shadow-lg overflow-hidden" style={{ width: '363px', height: '413px' }}>
                <Image 
                  src="/screenshots/system-of-record.png" 
                  alt="System of Record Dashboard"
                  width={363}
                  height={413}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col items-center gap-2 w-full text-center">
                <h3 className="text-2xl font-semibold text-black text-center w-full font-sans" style={{ fontSize: '24px', lineHeight: '28.80px', fontWeight: 600 }}>
                  System of Record
                </h3>
                <p className="text-xs text-center w-full font-sans" style={{ fontSize: '12px', lineHeight: '17.40px', fontWeight: 500, color: 'rgba(0, 0, 0, 0.55)' }}>
                  One secure source of truth for members and communication.
                </p>
              </div>
            </motion.div>

            {/* Card 2: Unified Alumni Network */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center gap-8 w-full max-w-[363px]"
            >
              <div className="w-full rounded-lg shadow-lg overflow-hidden" style={{ width: '363px', height: '413px' }}>
                <Image 
                  src="/screenshots/unified-alumni-network.png" 
                  alt="Unified Alumni Network Dashboard"
                  width={363}
                  height={413}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col items-center gap-2 w-full text-center">
                <h3 className="text-2xl font-semibold text-black text-center w-full font-sans" style={{ fontSize: '24px', lineHeight: '28.80px', fontWeight: 600 }}>
                  Unified Alumni Network
                </h3>
                <p className="text-xs text-center w-full font-sans" style={{ fontSize: '12px', lineHeight: '17.40px', fontWeight: 500, color: 'rgba(0, 0, 0, 0.55)' }}>
                  Profiles, messaging, and networking in one place.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Bottom Headline Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal mb-6 instrument-serif-regular text-gray-900">
              Alumni Relationship Management At Scale
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-sans">
              Trailblaize turns out-dated spreadsheets and email lists into an interactive community.
            </p>
          </motion.div>

          {/* Testimonial Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="w-full max-w-[800px] min-w-[640px] p-8 bg-white rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/10 flex flex-col justify-end items-center gap-6 overflow-hidden" style={{ boxShadow: '0px 6px 12px 0px rgba(0,0,0,0.03), 0px 4px 8px 0px rgba(0,0,0,0.02), -8px 12px 24px 0px rgba(0,0,0,0.08)' }}>  
              <div className="self-stretch flex justify-center items-center gap-4">
                <div className="flex-1 flex justify-start items-start gap-4">
                  <img 
                    className="w-12 h-12 rounded-lg" 
                    src="/screenshots/Artboard 21.png" 
                    alt="Nick Siebert"
                  />
                  <div className="flex-1 flex flex-col justify-start items-start gap-1">
                    <div className="self-stretch text-center text-black text-base font-semibold font-sans leading-6">
                      Nick Siebert
                    </div>
                    <div className="self-stretch text-center text-black/60 text-base font-medium font-sans leading-6">
                      Chapter President of Sigma Chi at Ole Miss
                    </div>
                  </div>
                </div>
                <img 
                  className="w-12 h-8" 
                  src={"/screenshots/quote.png"} 
                  alt="Decorative"
                />
              </div>
              <div className="w-full max-w-[736px] text-left text-black text-lg font-medium font-sans leading-7">
                Trailblaize turned our chapter email list into an interactive network. <br/>
                Members and alumni have landed jobs, internships, and even deal flow across generations of our fraternity, while staying connected to the chapter.
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="pt-4 md:pt-12 pb-8 md:pb-12 bg-gradient-to-tr from-slate-100 to-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header Section with Title and Graphic */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-6 md:mb-8"
          >
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6 lg:items-center">
              <div className="flex-1">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                  Built for
                  <br />
                  <span className="bg-gradient-to-r from-navy-600 via-blue-600 to-blue-500 bg-clip-text text-transparent">
                    Greek Life.
                  </span>
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                  Unlock the full potential of your chapter with our comprehensive platform. Manage operations, connect alumni, and strengthen your community—all in one place.
                </p>
              </div>
              {/* Graphic on the right */}
              <div className="hidden lg:block lg:flex-shrink-0">
                <div className="w-64 h-64 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <HeroIcon className="w-full h-full opacity-10" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Top Row - Left Narrower, Right Wider */}
          <div className="grid grid-cols-1 md:grid-cols-[0.45fr_0.55fr] gap-8 mb-8">
            {features.slice(0, 2).map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: feature.delay }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group"
                >
                  <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    {/* Subtle gradient background overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${index % 2 === 0 ? 'from-blue-50/50' : 'from-navy-50/30'} to-transparent pointer-events-none`} />
                    
                    <CardContent className="p-6 relative">
                      {/* Circular button in top-right corner */}
                      <div className="absolute top-8 right-8">
                        <button className="w-12 h-12 rounded-full bg-gradient-to-r from-navy-600 to-blue-600 hover:from-navy-500 hover:to-blue-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg z-10">
                          <ArrowRight className="h-5 w-5 text-white rotate-45" />
                        </button>
                      </div>

                      {/* Description text at the TOP */}
                      <div>
                        {/* Mobile version - shorter text */}
                        <p className="text-gray-600 leading-relaxed text-xs md:text-base mb-4 md:mb-6 pr-16 md:pr-20 md:hidden">
                          {feature.mobileDescription}
                        </p>
                        {/* Desktop version - full text */}
                        <p className="text-gray-600 leading-relaxed text-base mb-6 pr-20 hidden md:block">
                          {feature.description}
                        </p>
                      </div>

                      {/* Large Title at the BOTTOM */}
                      <h3 className="text-4xl md:text-5xl font-light text-gray-900">
                        {feature.title}
                      </h3>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Row - Left Wider, Right Narrower */}
          <div className="grid grid-cols-1 md:grid-cols-[0.55fr_0.45fr] gap-8">
            {features.slice(2, 4).map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index + 2}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: feature.delay }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group"
                >
                  <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    {/* Subtle gradient background overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${index % 2 === 0 ? 'from-blue-50/50' : 'from-navy-50/30'} to-transparent pointer-events-none`} />
                    
                    <CardContent className="p-6 relative">
                      {/* Circular button in top-right corner */}
                      <div className="absolute top-8 right-8">
                        <button className="w-12 h-12 rounded-full bg-gradient-to-r from-navy-600 to-blue-600 hover:from-navy-500 hover:to-blue-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg z-10">
                          <ArrowRight className="h-5 w-5 text-white rotate-45" />
                        </button>
                      </div>

                      {/* Description text at the TOP */}
                      <div>
                        {/* Mobile version - shorter text */}
                        <p className="text-gray-600 leading-relaxed text-xs md:text-base mb-4 md:mb-6 pr-16 md:pr-20 md:hidden">
                          {feature.mobileDescription}
                        </p>
                        {/* Desktop version - full text */}
                        <p className="text-gray-600 leading-relaxed text-base mb-6 pr-20 hidden md:block">
                          {feature.description}
                        </p>
                      </div>

                      {/* Large Title at the BOTTOM */}
                      <h3 className="text-4xl md:text-5xl font-light text-gray-900">
                        {feature.title}
                      </h3>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal mb-6 instrument-serif-regular text-gray-900">
              Simple Pricing that Scales With Your Community.
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-sans">
              Joining Trailblaize is free. Groups pay to own, customize, and manage their space on the platform. Subscriptions are billed to admins and executive leaders.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <Card className={`h-full bg-white border ${
                  plan.popular 
                    ? "border-gray-300 shadow-lg" 
                    : "border-gray-200 shadow-sm hover:shadow-md"
                } transition-all duration-300 relative`}>
                  <CardContent className="p-6 md:p-8 h-full flex flex-col">
                    {/* Title */}
                    <div className="mb-4">
                      <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2 font-sans">
                        {plan.name}
                      </h3>
                      <p className="text-sm md:text-base text-gray-600 font-sans">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl md:text-4xl font-bold text-gray-900 font-sans">{plan.price}</span>
                        {plan.period && (
                          <span className="text-base md:text-lg text-gray-600 font-sans">{plan.period}</span>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 md:space-y-4 mb-8 flex-grow">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <Check className="h-5 w-5 flex-shrink-0 text-gray-600 mt-0.5" />
                          <span className="text-sm md:text-base text-gray-700 font-sans leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Button 
                      onClick={plan.buttonAction}
                      className={`
                        w-full
                        ${plan.popular
                          ? "bg-black hover:bg-gray-900 text-white rounded-xl"
                          : "bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-xl"
                        }
                        font-medium
                        shadow-sm hover:shadow-md
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                        px-4 py-3
                        text-sm md:text-base
                      `}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative py-14 overflow-hidden">
        {/* Background similar to hero */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-navy-50/30"></div>
        
        {/* Decorative background elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-navy-200/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-block mb-4">
              <span className="text-sm font-medium text-gray-500 tracking-wide">ESTABLISHED 2025</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium text-gray-900 mb-6">
              About Trailblaize
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Built by Greek life alumni who understand the unique challenges of chapter management. We're passionate about helping organizations thrive through better technology.
            </p>
          </motion.div>

          {/* Statistics Row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14"
          >
            <div className="text-center md:text-left">
              <div className="text-5xl md:text-6xl font-light text-gray-900 mb-2">2025</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Year Founded</div>
              <div className="text-sm text-gray-600">Fresh and innovative</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-5xl md:text-6xl font-light text-gray-900 mb-2">3+</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Active Chapters</div>
              <div className="text-sm text-gray-600">Growing rapidly</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-5xl md:text-6xl font-light text-gray-900 mb-2">5,000+</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Alumni Network</div>
              <div className="text-sm text-gray-600">Strong connections</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-5xl md:text-6xl font-light text-gray-900 mb-2">24/7</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Support</div>
              <div className="text-sm text-gray-600">Always available</div>
            </div>
          </motion.div>

          {/* Mission Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Mission Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.8 }} 
              viewport={{ once: true }}
              className="md:col-span-2"
            >
              <div className="mb-6">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  To modernize Greek life operations by providing intuitive, powerful tools that strengthen alumni connections, streamline financial management, and empower chapter leadership.
                </p>
              </div>
              
              <div className="mt-8 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Available Now</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Ready to Transform Your Chapter?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">Join hundreds of chapters already using Trailblaize to strengthen their communities and streamline operations.</p>
            <div className="flex flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button 
                  size="lg" 
                  className="
                    bg-navy-600 hover:bg-navy-700 
                    text-white 
                    px-4 py-2 md:px-8 md:py-4 
                    text-sm md:text-lg 
                    rounded-full
                    font-medium
                    shadow-sm hover:shadow-md
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-300
                    group
                    whitespace-nowrap
                  "
                >
                  Start Today
                  <ArrowRight className="ml-1.5 md:ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="
                  border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900
                  px-4 py-2 md:px-8 md:py-4 
                  text-sm md:text-lg
                  rounded-full
                  font-medium
                  shadow-sm hover:shadow-md
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-300
                  whitespace-nowrap
                "
                onClick={() => window.open('mailto:support@trailblaize.com?subject=Schedule a Demo')}
              >
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

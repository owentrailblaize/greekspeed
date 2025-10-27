'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Users, DollarSign, Shield, Star, Check } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { Footer } from "@/components/marketing/Footer";
import { HeroIcon } from "./icons/HeroIcon";

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
    name: "Premium",
    monthlyPrice: "$5",
    yearlyPrice: "$50", // assuming yearly pricing
    period: "per member",
    description: "Full access for active members",
    features: [
      "Alumni Network Access",
      "Basic Profile",
      "Chapter Directory",
      "Dues Management"
    ],
    popular: true,
  },
  {
    name: "Executive",
    monthlyPrice: "Contact for pricing",
    yearlyPrice: "Contact for pricing",
    period: "",
    description: "Complete administrative suite",
    features: [
      "Executive Dashboard",
      "Chapter Analytics",
      "Chapter Management",
      "Custom Reporting",
    ],
    popular: false,
  },
];

export function LandingPage() {
  const [activeSection, setActiveSection] = useState("home");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Use the shared header component */}
      <MarketingHeader activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Hero Section */}
      <section id="home" className="relative pt-28 md:pt-24 pb-8 md:pb-16 overflow-hidden">
        {/* Background - make sure it covers full height */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-navy-50/30">
          <div className="absolute inset-0 bg-white/50 md:bg-white/30"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="relative w-full h-full"
        >
          {/* Top Left Icon */}
          <div className="absolute left-64 top-1/4 hidden lg:block opacity-20">
            <HeroIcon className="w-48 h-48 rotate-6" />
          </div>
        </motion.div>
        
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center">
            {/* Badge/Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mt-4 md:mt-0"
            >
              <Badge className="mb-4 bg-blue-50 text-navy-700 border-blue-200 hover:bg-blue-100 transition-colors">
                <Star className="w-3 h-3 mr-2" />
                The Future of Chapter Management
              </Badge>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="mb-6"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
                <span className="text-gray-900">Where Alumni</span>
                <br />
                <span className="bg-gradient-to-r from-navy-600 via-blue-600 to-blue-500 bg-clip-text text-transparent">
                  Networks Thrive
                </span>
              </h1>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="mb-10"
            >
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
                Streamline your chapter operations, connect with alumni, and manage finances with our comprehensive platform designed for modern fraternity and sorority management.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 md:mb-12 px-4"
            >
              <Link href="/sign-up">
                <Button size="lg" className="bg-navy-600 hover:bg-navy-700 text-white px-6 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all group">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-navy-400 px-6 py-4 text-lg rounded-lg"
                onClick={() => window.open('mailto:support@trailblaize.com?subject=Learn More About Trailblaize')}
              >
                Learn More
              </Button>
            </motion.div>

            {/* Statistics - Always show in one row */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="grid grid-cols-3 gap-2 md:gap-8 max-w-3xl mx-auto pt-6 md:pt-12 border-t border-gray-200 px-1 md:px-0"
            >
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-br from-navy-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  3+
                </div>
                <div className="text-xs md:text-sm lg:text-base text-gray-600 font-medium">Active Chapters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-br from-navy-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  5,000+
                </div>
                <div className="text-xs md:text-sm lg:text-base text-gray-600 font-medium">Connected Alumni</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-br from-navy-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  1,000+
                </div>
                <div className="text-xs md:text-sm lg:text-base text-gray-600 font-medium">Connected Members</div>
              </div>
            </motion.div>
          </div>
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
      <section id="pricing" className="py-10 bg-gradient-to-tl from-slate-200 to-white">
        {/* Decorative gradient overlays */}
        <div className="absolute left-0 top-0 w-1/4 h-full bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none"></div>
        <div className="absolute right-0 top-0 w-1/4 h-full bg-gradient-to-l from-navy-500/10 to-transparent pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 max-w-xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-mdeium text-black mb-6">
              Choose the Plan That's Right for You
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Streamline your chapter operations with powerful management tools and features. Upgrade to Executive for complete administrative control.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex justify-center mb-12"
          >
            <div className="inline-flex bg-gray-800 rounded-full p-1 border border-gray-700">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  billingPeriod === "monthly"
                    ? "bg-navy-600 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  billingPeriod === "yearly"
                    ? "bg-navy-600 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Yearly
              </button>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {pricingPlans.map((plan, index) => {
              const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
              const showDiscount = billingPeriod === "yearly" && plan.name === "Premium";
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative ${plan.popular ? "md:scale-105 z-10" : ""}`}
                >
                  <Card className={`h-full bg-white border-2 ${
                    plan.popular 
                      ? "border-blue-500 shadow-xl hover:shadow-2xl" 
                      : "border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl"
                  } transition-all duration-300 relative`}>
                    <CardContent className="p-8 h-full flex flex-col">
                      {/* Popular Badge */}
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-blue-600 text-white px-4 py-1">
                            Most Popular
                          </Badge>
                        </div>
                      )}

                      {/* Title */}
                      <div className="mb-3">
                        <h3 className={`text-xl font-bold mb-2 ${
                          plan.popular ? "text-blue-600" : "text-gray-900"
                        }`}>
                          {plan.name}
                        </h3>
                        <p className="text-gray-600">{plan.description}</p>
                      </div>

                      {/* Price */}
                      <div className="mb-8">
                        <div className="flex items-baseline gap-3">
                          <span className="text-4xl font-bold text-gray-900">{price}</span>
                          <div className="flex flex-col">
                            {plan.period && (
                              <span className="text-gray-600">/{plan.period}</span>
                            )}
                            {billingPeriod === "yearly" && plan.period && (
                              <span className="text-sm text-gray-500">billed yearly</span>
                            )}
                          </div>
                          {showDiscount && (
                            <Badge className="bg-blue-600 text-white ml-2">
                              -17%
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-4 mb-8 flex-grow">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          What's included
                        </p>
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center space-x-3">
                            <Check className={`h-5 w-5 flex-shrink-0 ${
                              plan.popular ? "text-blue-600" : "text-green-600"
                            }`} />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button - pushed to bottom with mt-auto */}
                      <Button className={`w-full ${
                        plan.popular
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      }`}>
                        {plan.name === "Executive" ? "Contact Sales" : "Subscribe"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
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

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Left Column - Mission */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.8 }} 
              viewport={{ once: true }}
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

            {/* Right Column - Testimonial Card */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.8 }} 
              viewport={{ once: true }}
            >
              <div className="relative overflow-hidden rounded-2xl p-8 border border-blue-200/40
                bg-blue-50/50 backdrop-blur-xl
                shadow-[0_8px_32px_rgba(59,130,246,0.15),inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(147,197,253,0.2)]
                hover:shadow-[0_12px_40px_rgba(59,130,246,0.2),inset_0_1px_0_rgba(255,255,255,0.7)]
                transition-all duration-300">
                
                {/* Optional: Add a blue gradient overlay for more tint */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-white/0 to-navy-400/10 pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-blue-100/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-blue-200/30">
                      <Star className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-gray-900 font-semibold text-lg">Nick Siebert</div>
                      <div className="text-blue-700 text-sm">Sigma Chi Eta</div>
                    </div>
                  </div>
                  <blockquote className="text-lg text-gray-800 leading-relaxed mb-6">
                    "Trailblaize has completely transformed how we manage our chapter. The alumni connections alone have been game-changing."
                  </blockquote>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Verified Chapter Leader</span>
                  </div>
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
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button size="lg" className="bg-navy-600 hover:bg-navy-700 text-white px-8 py-4 text-lg group">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="border-navy-300 text-navy-600 hover:bg-navy-50 px-8 py-4 text-lg">
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

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
    highlights: ["Alumni Pipeline", "Actively Hiring", "Chapter Directory"],
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    delay: 0.1,
  },
  {
    icon: DollarSign,
    title: "Dues Management",
    description: "Streamlined payment processing and financial tracking for chapter operations. Automated reminders and comprehensive reporting keep everything on track.",
    highlights: ["Payment Portal", "Financial Reports", "Automated Reminders"],
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    delay: 0.2,
  },
  {
    icon: Shield,
    title: "Executive Admin",
    description: "Comprehensive administrative tools for chapter leadership and management. Role-based access ensures secure and efficient operations.",
    highlights: ["Role-based Access", "Task Management", "Chapter Analytics"],
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    delay: 0.3,
  },
  {
    icon: Check,
    title: "Event Coordination",
    description: "Organize and manage chapter events with ease. Track RSVPs, manage vendors, and keep everyone informed about what's happening.",
    highlights: ["Event Planning", "Vendor Management", "RSVP Tracking"],
    color: "from-navy-500 to-navy-600",
    bgColor: "bg-navy-50",
    delay: 0.4,
  },
];

const pricingPlans = [
  {
    name: "Premium",
    price: "$5",
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
    price: "Contact for pricing",
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
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Use the shared header component */}
      <MarketingHeader activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Hero Section */}
      <section id="home" className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-navy-50/30"></div>

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
          
          {/* Bottom Right Icon */}
          <div className="absolute right-44 top-56 hidden lg:block opacity-20">
            <HeroIcon className="w-48 h-48 -rotate-6" />
          </div>
        </motion.div>
        
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center">
            {/* Badge/Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className=""
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
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
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
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Streamline your chapter operations, connect with alumni, and manage finances with our comprehensive platform designed for modern fraternity and sorority management.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
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
              >
                Learn More
              </Button>
            </motion.div>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto pt-12 border-t border-gray-200"
            >
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-navy-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  3+
                </div>
                <div className="text-sm md:text-base text-gray-600 font-medium">Active Chapters</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-navy-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  5,000+
                </div>
                <div className="text-sm md:text-base text-gray-600 font-medium">Connected Alumni</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-navy-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  1,000+
                </div>
                <div className="text-sm md:text-base text-gray-600 font-medium">Connected Members</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-10 bg-gradient-to-tr from-slate-100 to-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header Section with Title and Graphic */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6 lg:items-center">
              <div className="flex-1">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
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
                      <p className="text-gray-600 leading-relaxed text-base mb-6 pr-20">
                        {feature.description}
                      </p>

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
                      <p className="text-gray-600 leading-relaxed text-base mb-6 pr-20">
                        {feature.description}
                      </p>

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
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Choose the plan that fits your chapter's needs. All plans include our core features.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className={`relative ${plan.popular ? "scale-105" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-navy-600 text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                <Card className={`h-full ${plan.popular ? "border-navy-300 shadow-2xl" : "border-gray-200 shadow-lg"} hover:shadow-xl transition-all duration-300`}>
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 mb-4">{plan.description}</p>
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                        {plan.period && <span className="text-gray-600">/{plan.period}</span>}
                      </div>
                    </div>
                    <div className="space-y-4 mb-8">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button className={`w-full ${plan.popular ? "bg-navy-600 hover:bg-navy-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-900"}`}>
                      {plan.name === "Executive" ? "Contact Sales" : "Get Started"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">About Trailblaize</h2>
            <p className="text-xl text-navy-200 max-w-3xl mx-auto leading-relaxed">Built by Greek life alumni who understand the unique challenges of chapter management. We're passionate about helping organizations thrive through better technology.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
              <h3 className="text-3xl font-bold mb-6">Our Mission</h3>
              <p className="text-navy-200 text-lg leading-relaxed mb-6">To modernize Greek life operations by providing intuitive, powerful tools that strengthen alumni connections, streamline financial management, and empower chapter leadership.</p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold text-white mb-2">2025</div>
                  <div className="text-navy-300">Founded</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-2">24/7</div>
                  <div className="text-navy-300">Support</div>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="relative">
              <div className="bg-gradient-to-br from-navy-700 to-navy-600 rounded-2xl p-8 shadow-2xl">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Star className="h-10 w-10 text-yellow-400" />
                  </div>
                  <blockquote className="text-lg text-navy-100 mb-4">"Trailblaize has completely transformed how we manage our chapter. The alumni connections alone have been game-changing."</blockquote>
                  <div className="text-white font-semibold">Nick Siebert</div>
                  <div className="text-navy-300">Sigma Chi Eta</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
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

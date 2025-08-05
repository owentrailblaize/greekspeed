'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Users, DollarSign, Shield, Star, Check, Menu, X } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Logo served from public directory

const features = [
  {
    icon: Users,
    title: "Alumni Network",
    description: "Connect with thousands of alumni across industries with our LinkedIn-style platform",
    highlights: ["Alumni Pipeline", "Actively Hiring", "Chapter Directory"],
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    delay: 0.1,
  },
  {
    icon: DollarSign,
    title: "Dues Management",
    description: "Streamlined payment processing and financial tracking for chapter operations",
    highlights: ["Payment Portal", "Financial Reports", "Automated Reminders"],
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    delay: 0.2,
  },
  {
    icon: Shield,
    title: "Executive Admin",
    description: "Comprehensive administrative tools for chapter leadership and management",
    highlights: ["Role-based Access", "Task Management", "Chapter Analytics"],
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    delay: 0.3,
  },
];

const pricingPlans = [
  {
    name: "Basic",
    price: "$50",
    period: "per semester",
    description: "Perfect for individual members",
    features: ["Alumni Network Access", "Basic Profile", "Event Notifications", "Mobile App Access"],
    popular: false,
  },
  {
    name: "Premium",
    price: "$150",
    period: "per semester",
    description: "Full access for active members",
    features: [
      "Everything in Basic",
      "Dues Management",
      "Advanced Networking",
      "Priority Support",
      "Event Planning Tools",
    ],
    popular: true,
  },
  {
    name: "Executive",
    price: "$250",
    period: "per semester",
    description: "Complete administrative suite",
    features: [
      "Everything in Premium",
      "Executive Dashboard",
      "Chapter Analytics",
      "Role Management",
      "Custom Reporting",
      "White-label Options",
    ],
    popular: false,
  },
];

export function LandingPage() {
  const [activeSection, setActiveSection] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200/50 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div className="flex items-center space-x-3" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <div className="w-10 h-10 relative">
                <img src="/logo.jpeg" alt="Trailblaize logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-semibold text-xl text-gray-900">Trailblaize</span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {[
                { id: "features", label: "Features" },
                { id: "pricing", label: "Pricing" },
                { id: "about", label: "About Us" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    activeSection === id ? "text-navy-600" : "text-gray-700 hover:text-navy-600"
                  }`}
                >
                  {label}
                </button>
              ))}
              {/* Dashboard link for authenticated users */}
              <SignedIn>
                <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-navy-600">
                  Dashboard
                </Link>
              </SignedIn>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <SignedOut>
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-gray-700 hover:text-navy-600">
                    Log In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-navy-600 hover:bg-navy-700 text-white">Sign Up</Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-700">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-200"
            >
              <div className="px-6 py-4 space-y-4">
                {[
                  { id: "features", label: "Features" },
                  { id: "pricing", label: "Pricing" },
                  { id: "about", label: "About Us" },
                ].map(({ id, label }) => (
                  <button key={id} onClick={() => scrollToSection(id)} className="block w-full text-left text-gray-700 hover:text-navy-600">
                    {label}
                  </button>
                ))}
                <SignedIn>
                  <Link href="/dashboard" className="block w-full text-left text-gray-700 hover:text-navy-600">
                    Dashboard
                  </Link>
                </SignedIn>
                <SignedOut>
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <Link href="/sign-in">
                      <Button variant="ghost" className="w-full justify-start text-gray-700">
                        Log In
                      </Button>
                    </Link>
                    <Link href="/sign-up">
                      <Button className="w-full bg-navy-600 hover:bg-navy-700 text-white">Sign Up</Button>
                    </Link>
                  </div>
                </SignedOut>
                <SignedIn>
                  <div className="pt-4 border-t border-gray-200">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-50 via-white to-blue-50/30"></div>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-8"
            >
              <Badge className="mb-6 bg-navy-100 text-navy-700 border-navy-200">✨ The Future of Chapter Management</Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Where Alumni
                <br />
                <span className="bg-gradient-to-r from-navy-600 to-blue-600 bg-clip-text text-transparent">Networks Thrive</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Streamline your chapter operations, connect with alumni, and manage finances with our comprehensive platform designed for modern fraternity and sorority management.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16"
            >
              <Button size="lg" className="bg-navy-600 hover:bg-navy-700 text-white px-8 py-4 text-lg group">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="border-navy-300 text-navy-600 hover:bg-navy-50 px-8 py-4 text-lg">
                Watch Demo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-navy-600 mb-2">500+</div>
                <div className="text-gray-600">Active Chapters</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-navy-600 mb-2">50K+</div>
                <div className="text-gray-600">Connected Alumni</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-navy-600 mb-2">$2M+</div>
                <div className="text-gray-600">Dues Processed</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Discover how Trailblaize can help your chapter thrive with our powerful features.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: feature.delay }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-8">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                      <div className="space-y-3">
                        {feature.highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.color}`}></div>
                            <span className="text-sm text-gray-700">{highlight}</span>
                          </div>
                        ))}
                      </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                        <span className="text-gray-600">/{plan.period}</span>
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
                    <Button className={`w-full ${plan.popular ? "bg-navy-600 hover:bg-navy-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-900"}`}>Get Started</Button>
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
                  <div className="text-3xl font-bold text-white mb-2">2019</div>
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
                  <div className="text-white font-semibold">Sarah Johnson</div>
                  <div className="text-navy-300">Chapter President, Delta Gamma</div>
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 relative">
                <img src="/logo.jpeg" alt="Trailblaize logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-semibold text-lg">Trailblaize</span>
            </div>
            <div className="text-gray-400 text-sm">© 2024 Trailblaize. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

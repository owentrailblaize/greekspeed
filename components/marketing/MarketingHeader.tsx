'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { Button } from "@/components/ui/button";

interface MarketingHeaderProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function MarketingHeader({ activeSection = "home", onSectionChange }: MarketingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (onSectionChange) {
      onSectionChange(sectionId);
    }
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled 
        ? "bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-lg shadow-gray-900/5" 
        : "bg-white/90 backdrop-blur-lg border-b border-gray-200/60"
    }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-6 pl-2 md:pl-6">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <div className="flex items-center -ml-2 md:ml-0">
            <Link href="/" className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Trailblaize logo" 
                className="h-28 w-auto max-h-full object-contain transition-all duration-300 hover:opacity-90" 
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            {[
              { id: "features", label: "Features" },
              { id: "pricing", label: "Pricing" },
              { id: "about", label: "About Us" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`text-sm font-semibold transition-all duration-300 relative py-2 ${
                  activeSection === id 
                    ? "text-brand-primary" 
                    : "text-gray-600 hover:text-brand-primary"
                }`}
              >
                {label}
                {activeSection === id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-primary to-brand-accent rounded-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
            {/* Dashboard link for authenticated users */}
            {user && (
              <Link 
                href="/dashboard" 
                className="text-sm font-semibold text-gray-600 hover:text-brand-primary transition-colors py-2"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {!user ? (
              <>
                <Link href="/sign-in">
                  <Button 
                    variant="outline" 
                    className="
                      border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900
                      rounded-full
                      font-medium
                      shadow-sm hover:shadow-md
                      transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-focus
                      px-5
                    "
                    size="sm"
                  >
                    Log In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button 
                    className="
                      bg-brand-primary 
                      hover:bg-brand-primary-hover 
                      text-white 
                      rounded-full font-medium
                      border border-white/30 
                      shadow-[0_4px_14px_0_rgba(30,50,100,0.39)] 
                      hover:shadow-[0_6px_20px_0_rgba(30,50,100,0.5)]
                      transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-focus
                      px-6
                    "
                    size="sm"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{user.email?.split('@')[0]}</span>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => signOut()} 
                  className="hover:text-brand-primary hover:bg-gray-100/50"
                  size="sm"
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200"
          >
            <div className="px-6 py-5 space-y-1">
              {[
                { id: "features", label: "Features" },
                { id: "pricing", label: "Pricing" },
                { id: "about", label: "About Us" },
              ].map(({ id, label }) => (
                <button 
                  key={id} 
                  onClick={() => scrollToSection(id)} 
                  className={`block w-full text-left py-3 px-4 rounded-lg transition-all font-medium ${
                    activeSection === id
                      ? "text-brand-primary bg-brand-primary/10 shadow-sm"
                      : "text-gray-700 hover:text-brand-primary hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
              {user && (
                <Link 
                  href="/dashboard" 
                  className="block w-full text-left py-3 px-4 rounded-lg text-gray-700 hover:text-brand-primary hover:bg-gray-50 transition-all font-medium"
                >
                  Dashboard
                </Link>
              )}
              {!user ? (
                <div className="pt-4 border-t border-gray-200 mt-4 space-y-4">
                  <div className="flex justify-center">
                    <Link href="/sign-in">
                      <Button 
                        variant="outline"
                        className="
                          border border-gray-200 bg-white text-brand-primary hover:bg-gray-50
                          rounded-full
                          font-medium
                          shadow-sm hover:shadow-md
                          transition-all duration-200
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-focus
                          px-10 min-w-[140px] md:px-4 md:min-w-0
                          md:justify-start
                          md:w-full
                        "
                        size="lg"
                      >
                        Log In
                      </Button>
                    </Link>
                  </div>
                  <Link href="/sign-up" className="block mt-3 md:mt-0">
                    <Button 
                      className="
                        w-full
                        bg-brand-primary hover:bg-brand-primary-hover
                        text-white 
                        rounded-full
                        font-medium
                        shadow-sm hover:shadow-md
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-focus
                      "
                      size="lg"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <div className="flex items-center gap-3 mb-3 px-4 py-2 rounded-lg bg-gray-50">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{user.email}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start hover:bg-gray-50" 
                    onClick={() => signOut()}
                    size="lg"
                  >
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
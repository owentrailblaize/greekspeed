'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-context";
import { Button } from "@/components/ui/button";

interface MarketingHeaderProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function MarketingHeader({ activeSection = "home", onSectionChange }: MarketingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

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
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200/50 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div className="flex items-center space-x-3" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 relative">
                <img src="/logo.jpeg" alt="Trailblaize logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-semibold text-xl text-gray-900">Trailblaize</span>
            </Link>
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
            {user && (
              <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-navy-600">
                Dashboard
              </Link>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-gray-700 hover:text-navy-600">
                    Log In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-navy-600 hover:bg-navy-700 text-white">Sign Up</Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">{user.email}</span>
                <Button variant="ghost" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </div>
            )}
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
              {user && (
                <Link href="/dashboard" className="block w-full text-left text-gray-700 hover:text-navy-600">
                  Dashboard
                </Link>
              )}
              {!user ? (
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
              ) : (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700 mb-2">{user.email}</div>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => signOut()}>
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
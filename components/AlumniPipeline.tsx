"use client";

import { useState } from "react";
import { Search, Users, SlidersHorizontal, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LinkedInStyleAlumniCard } from "@/components/LinkedInStyleAlumniCard";
import { motion } from "framer-motion";

interface MutualConnection {
  name: string;
  avatar?: string;
}

interface Alumni {
  id: string;
  name: string;
  description: string;
  mutualConnections: MutualConnection[];
  mutualConnectionsCount: number;
  avatar?: string;
  verified?: boolean;
}

// shortened mock data
const mockAlumniData: Alumni[] = [
  {
    id: "1",
    name: "Connor McMullan",
    description: "Recently graduated ...",
    mutualConnections: [{ name: "Luke" }, { name: "Sarah" }, { name: "Mike" }],
    mutualConnectionsCount: 38,
    verified: false,
  },
  {
    id: "2",
    name: "Brett Ashy",
    description: "University of Mississippi Graduate ...",
    mutualConnections: [{ name: "Luke" }, { name: "Emily" }],
    mutualConnectionsCount: 30,
    verified: true,
  },
];

export function AlumniPipeline() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-navy-600" />
              <div>
                <h1 className="text-navy-900 font-semibold">People you may know in Greater Jackson Area</h1>
                <p className="text-gray-600 text-sm mt-1">Connect with alumni from your network</p>
              </div>
            </div>
            <Button variant="ghost" className="text-navy-600 hover:text-navy-700">
              Show all
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search alumni by name, school, or company..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 focus:border-navy-500 focus:ring-navy-500"
              />
            </div>
            <div className="flex items-center space-x-3">
              <Filter className="h-4 w-4 text-gray-500" />
              <SlidersHorizontal className="h-4 w-4 text-gray-500" />
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue placeholder="Graduation Year" />
                </SelectTrigger>
                <SelectContent>
                  {["2024", "2023", "2022", "2021", "2020"].map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                  <SelectItem value="older">2019 & Earlier</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { v: "tech", l: "Technology" },
                    { v: "finance", l: "Finance" },
                    { v: "consulting", l: "Consulting" },
                    { v: "healthcare", l: "Healthcare" },
                    { v: "education", l: "Education" },
                  ].map((opt) => (
                    <SelectItem key={opt.v} value={opt.v}>{opt.l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { v: "jackson", l: "Jackson, MS" },
                    { v: "oxford", l: "Oxford, MS" },
                    { v: "atlanta", l: "Atlanta, GA" },
                    { v: "dallas", l: "Dallas, TX" },
                  ].map((opt) => (
                    <SelectItem key={opt.v} value={opt.v}>{opt.l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          {mockAlumniData.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.05 }}>
              <LinkedInStyleAlumniCard {...a} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
} 
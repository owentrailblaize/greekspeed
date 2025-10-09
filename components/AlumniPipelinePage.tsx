import { useState } from "react";
import {
  Search,
  Filter,
  Users,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LinkedInStyleAlumniCard } from "./LinkedInStyleAlumniCard";
import { motion } from "framer-motion";
import { getEarlierCutoffYear } from "@/lib/mockAlumni";

// Mock data for alumni
const mockAlumniData = [
  {
    id: "1",
    name: "Connor McMullan",
    description:
      "Recently graduated from the University of Mississippi with a degree in Business Administration",
    mutualConnections: [
      { name: "Luke", avatar: undefined },
      { name: "Sarah", avatar: undefined },
      { name: "Mike", avatar: undefined },
    ],
    mutualConnectionsCount: 38,
    avatar: undefined,
    verified: false,
  },
  {
    id: "2",
    name: "Brett Ashy",
    description:
      "University of Mississippi Graduate specializing in Engineering",
    mutualConnections: [
      { name: "Luke", avatar: undefined },
      { name: "Emily", avatar: undefined },
    ],
    mutualConnectionsCount: 30,
    avatar: undefined,
    verified: true,
  },
  {
    id: "3",
    name: "Margaret Dye",
    description:
      "Honors Student at the University of Mississippi pursuing Psychology",
    mutualConnections: [
      { name: "Victoria", avatar: undefined },
      { name: "James", avatar: undefined },
    ],
    mutualConnectionsCount: 17,
    avatar: undefined,
    verified: false,
  },
  {
    id: "4",
    name: "Rush Bland",
    description:
      "Student at University of Mississippi studying Computer Science",
    mutualConnections: [
      { name: "Josh", avatar: undefined },
      { name: "Alex", avatar: undefined },
    ],
    mutualConnectionsCount: 12,
    avatar: undefined,
    verified: true,
  },
  {
    id: "5",
    name: "Kinkead Dent",
    description:
      "Business major at University of Mississippi with focus on Finance",
    mutualConnections: [
      { name: "William", avatar: undefined },
      { name: "Bryan", avatar: undefined },
    ],
    mutualConnectionsCount: 50,
    avatar: undefined,
    verified: false,
  },
  {
    id: "6",
    name: "Victor Razi",
    description:
      "First Year Dental Student at The University of Mississippi Medical Center",
    mutualConnections: [
      { name: "Worth", avatar: undefined },
      { name: "Michael", avatar: undefined },
    ],
    mutualConnectionsCount: 110,
    avatar: undefined,
    verified: false,
  },
  {
    id: "7",
    name: "Anabel McCraney",
    description:
      "Honors Student at University of Mississippi majoring in International Studies",
    mutualConnections: [
      { name: "Jane", avatar: undefined },
      { name: "Emma", avatar: undefined },
    ],
    mutualConnectionsCount: 6,
    avatar: undefined,
    verified: false,
  },
  {
    id: "8",
    name: "Denton Smith",
    description:
      "Customer Service Representative / Parts Specialist with automotive experience",
    mutualConnections: [
      { name: "John", avatar: undefined },
      { name: "Kennedy", avatar: undefined },
    ],
    mutualConnectionsCount: 134,
    avatar: undefined,
    verified: true,
  },
  {
    id: "9",
    name: "Sarah Chen",
    description:
      "Software Engineer at Google with expertise in Full-Stack Development",
    mutualConnections: [
      { name: "David", avatar: undefined },
      { name: "Lisa", avatar: undefined },
    ],
    mutualConnectionsCount: 25,
    avatar: undefined,
    verified: true,
  },
  {
    id: "10",
    name: "Michael Rodriguez",
    description:
      "Product Manager at Microsoft focusing on cloud solutions",
    mutualConnections: [
      { name: "Jessica", avatar: undefined },
      { name: "Ryan", avatar: undefined },
    ],
    mutualConnectionsCount: 43,
    avatar: undefined,
    verified: false,
  },
  {
    id: "11",
    name: "Emily Johnson",
    description:
      "Data Scientist at Netflix specializing in Machine Learning algorithms",
    mutualConnections: [
      { name: "Kevin", avatar: undefined },
      { name: "Amanda", avatar: undefined },
    ],
    mutualConnectionsCount: 31,
    avatar: undefined,
    verified: true,
  },
  {
    id: "12",
    name: "David Kim",
    description:
      "Engineering Manager at Stripe leading fintech innovation",
    mutualConnections: [
      { name: "Rachel", avatar: undefined },
      { name: "Marcus", avatar: undefined },
    ],
    mutualConnectionsCount: 67,
    avatar: undefined,
    verified: true,
  },
];

export function AlumniPipelinePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Title and Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-navy-600" />
              <div>
                <h1 className="text-navy-900 font-semibold">
                  People you may know in Greater Jackson Area
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Connect with alumni from your network
                </p>
              </div>
            </div>
            <Button
              className="text-navy-600 hover:text-navy-700"
              variant="ghost"
            >
              Show all
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search alumni by name, school, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 focus:border-navy-500 focus:ring-navy-500"
              />
            </div>

            <div className="flex items-center space-x-3">
              <Filter className="h-4 w-4 text-gray-500" />
              <SlidersHorizontal className="h-4 w-4 text-gray-500" />

              <Select
                value={selectedYear}
                onValueChange={setSelectedYear}
                placeholder="Graduation Year"
              >
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                  <SelectItem value="2020">2020</SelectItem>
                  <SelectItem value="older">
                    {getEarlierCutoffYear()} & Earlier
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedIndustry}
                onValueChange={setSelectedIndustry}
                placeholder="Industry"
              >
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech">
                    Technology
                  </SelectItem>
                  <SelectItem value="finance">
                    Finance
                  </SelectItem>
                  <SelectItem value="consulting">
                    Consulting
                  </SelectItem>
                  <SelectItem value="healthcare">
                    Healthcare
                  </SelectItem>
                  <SelectItem value="education">
                    Education
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
                placeholder="Location"
              >
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jackson">
                    Jackson, MS
                  </SelectItem>
                  <SelectItem value="oxford">
                    Oxford, MS
                  </SelectItem>
                  <SelectItem value="atlanta">
                    Atlanta, GA
                  </SelectItem>
                  <SelectItem value="dallas">
                    Dallas, TX
                  </SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Alumni Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          {mockAlumniData.map((alumni, index) => (
            <motion.div
              key={alumni.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.05,
              }}
            >
              <LinkedInStyleAlumniCard
                name={alumni.name}
                description={alumni.description}
                mutualConnections={alumni.mutualConnections}
                mutualConnectionsCount={
                  alumni.mutualConnectionsCount
                }
                avatar={alumni.avatar}
                verified={alumni.verified}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Load More Button */}
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="border-navy-600 text-navy-600 hover:bg-navy-50"
          >
            Load more alumni
          </Button>
        </div>
      </div>
    </div>
  );
}
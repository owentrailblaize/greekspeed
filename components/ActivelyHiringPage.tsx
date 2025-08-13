"use client";

import { useState, useRef } from "react";
import { Search, Briefcase, Bookmark, Share2, MapPin, Calendar, Building, Clock, DollarSign, X, MessageCircle, User, GraduationCap, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useProfile } from "@/lib/hooks/useProfile";

// Mock job data
const mockJobs = [
  {
    id: "1",
    title: "Senior Software Engineer",
    company: "Stripe",
    companyLogo: "S",
    industry: "Financial Technology",
    location: "San Francisco, CA",
    remoteType: "hybrid",
    jobType: "Full-time",
    salary: { min: 150000, max: 200000, currency: "USD", period: "yearly" },
    description: "We're looking for a Senior Software Engineer to join our Payments team. You'll work on building scalable payment infrastructure that processes billions of dollars annually.",
    requirements: ["5+ years of software engineering experience", "Strong knowledge of distributed systems", "Experience with Go, Python, or similar languages"],
    benefits: ["Competitive salary", "Health insurance", "401k matching", "Flexible PTO"],
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isNew: true,
    isPromoted: false,
    workAuthorization: "US work authorization required",
    connectedAlumni: [
      { id: "1", name: "David Kim", role: "Engineering Manager", pledgeYear: "2019", chapter: "Alpha Chapter", avatar: "DK", isConnected: true },
      { id: "2", name: "Sarah Chen", role: "Senior Engineer", pledgeYear: "2020", chapter: "Beta Chapter", avatar: "SC", isConnected: false }
    ]
  },
  {
    id: "2",
    title: "Product Manager",
    company: "Salesforce",
    companyLogo: "S",
    industry: "Customer Relationship Management",
    location: "New York, NY",
    remoteType: "remote",
    jobType: "Full-time",
    salary: { min: 120000, max: 160000, currency: "USD", period: "yearly" },
    description: "Join our Product team to help build the next generation of CRM tools. You'll work closely with engineering and design to deliver exceptional user experiences.",
    requirements: ["3+ years of product management experience", "Strong analytical skills", "Experience with B2B SaaS products"],
    benefits: ["Competitive salary", "Health insurance", "Stock options", "Remote work"],
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    applicationDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    isNew: true,
    isPromoted: true,
    workAuthorization: "US work authorization required",
    connectedAlumni: [
      { id: "3", name: "Jessica Wong", role: "Director of Sales", pledgeYear: "2020", chapter: "Gamma Chapter", avatar: "JW", isConnected: false }
    ]
  },
  {
    id: "3",
    title: "Marketing Manager",
    company: "Airbnb",
    companyLogo: "A",
    industry: "Travel & Hospitality",
    location: "Austin, TX",
    remoteType: "onsite",
    jobType: "Full-time",
    salary: { min: 80000, max: 110000, currency: "USD", period: "yearly" },
    description: "Help us grow our presence in the Austin market. You'll develop and execute marketing strategies to increase brand awareness and drive bookings.",
    requirements: ["4+ years of marketing experience", "Experience with digital marketing", "Strong communication skills"],
    benefits: ["Competitive salary", "Health insurance", "Travel credits", "Flexible work schedule"],
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    isNew: false,
    isPromoted: false,
    workAuthorization: "US work authorization required",
    connectedAlumni: [
      { id: "4", name: "Alex Thompson", role: "VP of Marketing", pledgeYear: "2018", chapter: "Delta Chapter", avatar: "AT", isConnected: true }
    ]
  },
  {
    id: "4",
    title: "Data Scientist",
    company: "Uber",
    companyLogo: "U",
    industry: "Transportation & Technology",
    location: "Seattle, WA",
    remoteType: "hybrid",
    jobType: "Full-time",
    salary: { min: 130000, max: 180000, currency: "USD", period: "yearly" },
    description: "Join our Data Science team to help optimize our ride-sharing algorithms and improve user experience through data-driven insights.",
    requirements: ["PhD in Statistics, Computer Science, or related field", "Experience with machine learning", "Proficiency in Python and SQL"],
    benefits: ["Competitive salary", "Health insurance", "Stock options", "Flexible PTO"],
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
    isNew: false,
    isPromoted: false,
    workAuthorization: "US work authorization required",
    connectedAlumni: []
  }
];

interface Salary {
  min: number;
  max: number;
  currency: string;
  period: string;
}

export function ActivelyHiringPage() {
  const { profile, loading } = useProfile();
  const [selectedJob, setSelectedJob] = useState(mockJobs[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [remoteFilter, setRemoteFilter] = useState("");
  const [postedWithinFilter, setPostedWithinFilter] = useState("");

  // Add ref for the right panel
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Function to handle job selection with scroll reset
  const handleJobSelection = (job: typeof mockJobs[0]) => {
    setSelectedJob(job);
    
    // Scroll the right panel to the top after a brief delay to ensure DOM update
    setTimeout(() => {
      if (rightPanelRef.current) {
        rightPanelRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  // Function to check if user can post jobs
  const canPostJob = () => {
    if (!profile || loading) return false;
    
    const userRole = profile.role as string; // Type assertion to string instead of any
    console.log('User role:', userRole);
    
    // Check for 'active_member' role (exact match from database)
    if (userRole === 'active_member') {
      console.log('User is active_member - hiding button');
      return false;
    }
    
    console.log('User can post job - showing button');
    return true;
  };

  const filteredJobs = mockJobs.filter(job => {
    if (searchTerm && !job.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !job.company.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (jobTypeFilter && job.jobType !== jobTypeFilter) return false;
    if (remoteFilter && job.remoteType !== remoteFilter) return false;
    return true;
  });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const formatSalary = (salary: Salary) => {
    if (salary.period === "yearly") {
      return `$${(salary.min / 1000).toFixed(0)}K-${(salary.max / 1000).toFixed(0)}K/yr`;
    }
    return `$${salary.min}-${salary.max}/${salary.period}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-6 w-6 text-navy-600" />
              <h1 className="text-navy-900 font-medium text-lg">Actively Hiring</h1>
            </div>
            {canPostJob() && (
              <Button className="bg-navy-600 hover:bg-navy-700 text-white">
                Post Job Opening
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - 2 Pane Layout */}
      <div className="flex h-screen">
        {/* Left Pane: Job List Sidebar */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Search and Filters Header - Fixed height */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search jobs" 
                className="pl-10 bg-white border-gray-300 focus:border-navy-500 focus:ring-navy-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Select value={jobTypeFilter} onValueChange={setJobTypeFilter} placeholder="Job Type">
                <SelectTrigger className="w-32 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={remoteFilter} onValueChange={setRemoteFilter} placeholder="Remote">
                <SelectTrigger className="w-32 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={postedWithinFilter} onValueChange={setPostedWithinFilter} placeholder="Posted">
                <SelectTrigger className="w-32 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any time</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{filteredJobs.length} jobs found</span>
              <Select value="most-relevant" placeholder="Sort by">
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="most-relevant">Most relevant</SelectItem>
                  <SelectItem value="recently-posted">Recently posted</SelectItem>
                  <SelectItem value="salary-high">Salary (High to Low)</SelectItem>
                  <SelectItem value="salary-low">Salary (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job Listings - Takes remaining height and scrolls */}
          <div className="flex-1 overflow-y-auto">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedJob?.id === job.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                }`}
                onClick={() => handleJobSelection(job)}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-navy-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">{job.companyLogo}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 truncate">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.company}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Bookmark className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span className="capitalize">{job.jobType}</span>
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {job.location}
                      </span>
                    </div>
                    
                    {job.salary && (
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {formatSalary(job.salary)}
                      </div>
                    )}
                    
                    {/* Alumni Hiring Section */}
                    {job.connectedAlumni && job.connectedAlumni.length > 0 && (
                      <div 
                        className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent job selection
                          handleJobSelection(job); // Use the new handler
                          // Scroll to connected alumni section after a brief delay to ensure DOM update
                          setTimeout(() => {
                            const alumniSection = document.getElementById('connected-alumni-section');
                            if (alumniSection) {
                              alumniSection.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'start' 
                              });
                            }
                          }, 200); // Increased delay to ensure job loads first
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-blue-800">
                            {job.connectedAlumni.length} Alumni Hiring
                          </span>
                          <Users className="h-3 w-3 text-blue-600" />
                        </div>
                        <div className="flex items-center space-x-6">
                          {job.connectedAlumni.slice(0, 2).map((alumni) => (
                            <div key={alumni.id} className="flex items-center space-x-1">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-medium">{alumni.avatar}</span>
                              </div>
                              <span className="text-xs text-blue-700">{alumni.name}</span>
                            </div>
                          ))}
                          {job.connectedAlumni.length > 2 && (
                            <span className="text-xs text-blue-600">
                              +{job.connectedAlumni.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* No Alumni Connected Indicator */}
                    {(!job.connectedAlumni || job.connectedAlumni.length === 0) && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600">No alumni connections yet</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-2 flex items-center space-x-2">
                      {job.isNew && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          New
                        </Badge>
                      )}
                      {job.isPromoted && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          Promoted
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-400">
                      Posted {formatDate(job.postedDate)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Job Detail + Connected Alumni */}
        <div 
          ref={rightPanelRef} 
          className="flex-1 bg-gray-50 overflow-y-auto"
        >
          {selectedJob ? (
            <div className="p-6">
              {/* Job Detail Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                {/* Company Header */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-navy-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl font-medium">{selectedJob.companyLogo}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedJob.company}</h2>
                    <p className="text-gray-600">{selectedJob.industry}</p>
                  </div>
                </div>

                {/* Job Title and Actions */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedJob.title}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Posted {formatDate(selectedJob.postedDate)}
                      </span>
                      {selectedJob.applicationDeadline && (
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Apply by {selectedJob.applicationDeadline.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" size="sm">
                      <Bookmark className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      Apply
                    </Button>
                  </div>
                </div>

                {/* At a Glance Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Building className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{selectedJob.jobType}</p>
                      <p className="text-xs text-gray-600">Job Type</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{selectedJob.remoteType}</p>
                      <p className="text-xs text-gray-600">Work Style</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedJob.salary ? formatSalary(selectedJob.salary) : "Not specified"}
                      </p>
                      <p className="text-xs text-gray-600">Salary</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Required</p>
                      <p className="text-xs text-gray-600">Work Authorization</p>
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedJob.description}</p>
                </div>

                {/* Requirements */}
                {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {selectedJob.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {selectedJob.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Connected Alumni Section */}
              {selectedJob.connectedAlumni && selectedJob.connectedAlumni.length > 0 && (
                <div id="connected-alumni-section" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Connected Alumni at {selectedJob.company}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Connect with alumni who work at this company to learn more about the role and get insider insights.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedJob.connectedAlumni.map((alumni) => (
                      <Card key={alumni.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-navy-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-sm font-medium">{alumni.avatar}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{alumni.name}</h4>
                              <p className="text-sm text-gray-600">{alumni.role}</p>
                              <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                                <GraduationCap className="h-3 w-3" />
                                <span>Class of {alumni.pledgeYear}</span>
                                <Users className="h-3 w-3 ml-2" />
                                <span>{alumni.chapter}</span>
                              </div>
                              
                              <div className="mt-3">
                                {alumni.isConnected ? (
                                  <Button variant="outline" size="sm" className="w-full">
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Message
                                  </Button>
                                ) : (
                                  <Button size="sm" className="w-full bg-navy-600 hover:bg-navy-700 text-white">
                                    Connect
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Ask a Question Section (if no connected alumni) */}
              {(!selectedJob.connectedAlumni || selectedJob.connectedAlumni.length === 0) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Ask about this role
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Don&apos;t see any connected alumni? Contact the hiring team to ask questions about the role or how to succeed in the interview process.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Hiring Team</h4>
                        <p className="text-sm text-gray-600">{selectedJob.company} Recruiting</p>
                      </div>
                      <Button variant="outline">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a job to view details</h3>
                <p className="text-gray-600">Choose a job posting from the left to see full details and connected alumni.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
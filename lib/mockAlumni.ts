export interface Alumni {
  id: string; // This will be the user_id for connection functionality
  alumniId?: string; // Original alumni table ID
  firstName: string;
  lastName: string;
  fullName: string;
  chapter: string;
  industry: string;
  graduationYear: number;
  company: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  description: string;
  mutualConnections: MutualConnection[];
  mutualConnectionsCount: number;
  avatar?: string;
  verified?: boolean;
  isActivelyHiring?: boolean;
  lastContact?: string;
  tags: string[];
  hasProfile?: boolean; // Indicates if this alumni has a linked profile
}

export interface MutualConnection {
  name: string;
  avatar?: string;
}

export const mockAlumniData: Alumni[] = [
  {
    id: "1",
    firstName: "Connor",
    lastName: "McMullan",
    fullName: "Connor McMullan",
    chapter: "Sigma Chi",
    industry: "Technology",
    graduationYear: 2024,
    company: "Microsoft",
    jobTitle: "Software Engineer",
    email: "connor.mcmullan@microsoft.com",
    phone: "(601) 555-0123",
    location: "Jackson, MS",
    description: "Recently graduated from University of Mississippi with a Computer Science degree. Passionate about cloud computing and AI.",
    mutualConnections: [{ name: "Luke" }, { name: "Sarah" }, { name: "Mike" }],
    mutualConnectionsCount: 38,
    verified: false,
    isActivelyHiring: false,
    lastContact: "2024-01-15",
    tags: ["Software Engineering", "Cloud Computing", "AI/ML"]
  },
  {
    id: "2",
    firstName: "Brett",
    lastName: "Ashy",
    fullName: "Brett Ashy",
    chapter: "Sigma Chi",
    industry: "Finance",
    graduationYear: 2023,
    company: "Goldman Sachs",
    jobTitle: "Investment Analyst",
    email: "brett.ashy@gs.com",
    phone: "(601) 555-0456",
    location: "Atlanta, GA",
    description: "University of Mississippi Graduate with Finance degree. Specializing in investment banking and market analysis.",
    mutualConnections: [{ name: "Luke" }, { name: "Emily" }],
    mutualConnectionsCount: 30,
    verified: true,
    isActivelyHiring: false,
    lastContact: "2024-02-01",
    tags: ["Investment Banking", "Market Analysis", "Finance"]
  },
  {
    id: "3",
    firstName: "Margaret",
    lastName: "Dye",
    fullName: "Margaret Dye",
    chapter: "Delta Gamma",
    industry: "Consulting",
    graduationYear: 2022,
    company: "McKinsey & Company",
    jobTitle: "Management Consultant",
    email: "margaret.dye@mckinsey.com",
    phone: "(601) 555-0789",
    location: "Dallas, TX",
    description: "Strategic consultant helping Fortune 500 companies optimize their operations and digital transformation.",
    mutualConnections: [{ name: "Sarah" }, { name: "David" }, { name: "Lisa" }],
    mutualConnectionsCount: 45,
    verified: true,
    isActivelyHiring: true,
    lastContact: "2024-01-20",
    tags: ["Strategy", "Digital Transformation", "Operations"]
  },
  {
    id: "4",
    firstName: "Rush",
    lastName: "Bland",
    fullName: "Rush Bland",
    chapter: "Sigma Chi",
    industry: "Healthcare",
    graduationYear: 2021,
    company: "Mayo Clinic",
    jobTitle: "Healthcare Administrator",
    email: "rush.bland@mayoclinic.org",
    phone: "(601) 555-0321",
    location: "Oxford, MS",
    description: "Healthcare professional focused on improving patient care and hospital operations through innovative solutions.",
    mutualConnections: [{ name: "Mike" }, { name: "Jennifer" }],
    mutualConnectionsCount: 22,
    verified: false,
    isActivelyHiring: false,
    lastContact: "2024-02-10",
    tags: ["Healthcare", "Patient Care", "Administration"]
  },
  {
    id: "5",
    firstName: "Kinkead",
    lastName: "Dent",
    fullName: "Kinkead Dent",
    chapter: "Sigma Chi",
    industry: "Education",
    graduationYear: 2020,
    company: "University of Mississippi",
    jobTitle: "Admissions Counselor",
    email: "kinkead.dent@olemiss.edu",
    phone: "(601) 555-0654",
    location: "Oxford, MS",
    description: "Helping students navigate their college journey and find their perfect academic path.",
    mutualConnections: [{ name: "Emily" }, { name: "Robert" }, { name: "Amanda" }],
    mutualConnectionsCount: 67,
    verified: true,
    isActivelyHiring: false,
    lastContact: "2024-01-30",
    tags: ["Education", "Student Services", "Admissions"]
  },
  {
    id: "6",
    firstName: "Victor",
    lastName: "Razi",
    fullName: "Victor Razi",
    chapter: "Sigma Chi",
    industry: "Technology",
    graduationYear: 2019,
    company: "Google",
    jobTitle: "Senior Software Engineer",
    email: "victor.razi@google.com",
    phone: "(601) 555-0987",
    location: "Atlanta, GA",
    description: "Experienced software engineer working on large-scale distributed systems and machine learning applications.",
    mutualConnections: [{ name: "David" }, { name: "Lisa" }, { name: "Mark" }],
    mutualConnectionsCount: 89,
    verified: true,
    isActivelyHiring: true,
    lastContact: "2024-02-05",
    tags: ["Distributed Systems", "Machine Learning", "Backend Development"]
  }
];

export const graduationYears = [2024, 2023, 2022, 2021, 2020, 2019];

export const industries = [
  "Technology",
  "Finance", 
  "Consulting",
  "Healthcare",
  "Education",
  "Marketing",
  "Sales",
  "Legal",
  "Non-profit"
];

export const chapters = [
  "Sigma Chi",
  "Delta Gamma", 
  "Kappa Alpha",
  "Phi Mu",
  "Pi Kappa Alpha",
  "Alpha Delta Pi",
  "Sigma Nu",
  "Delta Delta Delta"
];

export const locations = [
  "Jackson, MS",
  "Oxford, MS", 
  "Atlanta, GA",
  "Dallas, TX",
  "Nashville, TN",
  "Birmingham, AL",
  "Memphis, TN",
  "New Orleans, LA"
]; 
"use client";

import { Search, Filter, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlumniCard } from "@/components/AlumniCard";

const hiringAlumni = [
  { id: "1", name: "David Kim", pledgeYear: "2019", role: "Engineering Manager", company: "Stripe", tags: ["Software Engineers", "Product Managers", "Engineering"] },
  { id: "2", name: "Jessica Wong", pledgeYear: "2020", role: "Director of Sales", company: "Salesforce", tags: ["Sales Reps", "Account Executives", "Sales"] },
  { id: "3", name: "Alex Thompson", pledgeYear: "2018", role: "VP of Marketing", company: "Airbnb", tags: ["Marketing Managers", "Growth", "Marketing"] },
  { id: "4", name: "Maria Garcia", pledgeYear: "2017", role: "Head of Product", company: "Uber", tags: ["Product Designers", "Product Managers", "Product"] },
  { id: "5", name: "Ryan O'Connor", pledgeYear: "2021", role: "Senior Manager", company: "Deloitte", tags: ["Consultants", "Business Analysts", "Consulting"] },
  { id: "6", name: "Priya Patel", pledgeYear: "2016", role: "Director of Engineering", company: "Meta", tags: ["Frontend Engineers", "Backend Engineers", "Engineering"] },
];

export function ActivelyHiringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-6 w-6 text-navy-600" />
              <h1 className="text-navy-900 font-medium">Actively Hiring</h1>
            </div>
            <Button className="bg-navy-600 hover:bg-navy-700 text-white">Post Job Opening</Button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by company, role, or hiring needs..." className="pl-10 bg-white border-gray-300 focus:border-navy-500 focus:ring-navy-500" />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              {/* Company size select */}
              <Select placeholder="Company Size">
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup (1-50)</SelectItem>
                  <SelectItem value="small">Small (51-200)</SelectItem>
                  <SelectItem value="medium">Medium (201-1000)</SelectItem>
                  <SelectItem value="large">Large (1000+)</SelectItem>
                </SelectContent>
              </Select>
              {/* Job function select */}
              <Select placeholder="Job Function" >
                <SelectTrigger className="w-40 bg-white border-gray-300"><SelectValue/></SelectTrigger>
                <SelectContent>
                  {['engineering','product','sales','marketing','consulting','finance'].map(v=> <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              {/* Remote select */}
              <Select placeholder="Remote/On-site">
                <SelectTrigger className="w-40 bg-white border-gray-300"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <p className="text-gray-600 mb-6">Connect with {hiringAlumni.length} alumni who are actively hiring at their companies</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hiringAlumni.map(a => (
            <AlumniCard key={a.id} {...a} />
          ))}
        </div>
      </div>
    </div>
  );
} 
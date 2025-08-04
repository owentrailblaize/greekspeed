import { Search, Filter, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AlumniHeader() {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-navy-600" />
            <h1 className="text-navy-900 font-medium">Alumni Pipeline</h1>
          </div>
          <Button className="bg-navy-600 hover:bg-navy-700 text-white">Export List</Button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search alumni by name, company, or role..." className="pl-10 bg-white border-gray-300 focus:border-navy-500 focus:ring-navy-500" />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select>
              <SelectTrigger className="w-40 bg-white border-gray-300"><SelectValue placeholder="Graduation Year" /></SelectTrigger>
              <SelectContent>
                {["2024","2023","2022","2021","2020","older"].map(y=> <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-40 bg-white border-gray-300"><SelectValue placeholder="Industry" /></SelectTrigger>
              <SelectContent>
                {["tech","finance","consulting","healthcare","education","other"].map(v=> <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-40 bg-white border-gray-300"><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                {["ny","sf","la","chicago","boston","remote"].map(v=> <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
} 
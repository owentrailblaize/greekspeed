'use client';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Users, AlertTriangle, CheckCircle, Download, Mail, Plus, Calendar, Edit, Eye, UserPlus, X, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem, SelectContent } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useProfile } from "@/lib/contexts/ProfileContext";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DuesCycle {
  id: string;
  name: string;
  base_amount: number;
  due_date: string;
  close_date: string | null;
  status: string;
  allow_payment_plans: boolean;
  created_at: string;
}

interface DuesAssignment {
  id: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    member_status: string;
  };
  status: 'required' | 'exempt' | 'reduced' | 'waived' | 'paid';
  amount_assessed: number;
  amount_due: number;
  amount_paid: number;
  notes?: string;
  cycle: {
    name: string;
    due_date: string;
  };
}

interface ChapterMember {
  id: string;
  full_name: string;
  email: string;
  member_status: string;
  current_dues_amount: number;
  dues_status: string;
  last_dues_assignment_date: string | null;
  role: string;
  chapter_role: string;
}

// Add CSV export function for dues data
const exportDuesToCSV = (assignments: DuesAssignment[], filename: string = "dues-export.csv") => {
  // Define the CSV headers
  const headers = [
    "Member Name",
    "Email", 
    "Class",
    "Amount Due",
    "Amount Paid",
    "Status",
    "Due Date",
    "Cycle Name",
    "Notes"
  ];

  // Convert assignments data to CSV rows
  const csvRows = assignments.map(assignment => [
    assignment.user.full_name || "",
    assignment.user.email || "",
    assignment.user.member_status || "",
    assignment.amount_due || 0,
    assignment.amount_paid || 0,
    assignment.status || "",
    new Date(assignment.cycle.due_date).toLocaleDateString(),
    assignment.cycle.name || "",
    assignment.notes || ""
  ]);

  // Combine headers and data
  const csvContent = [headers, ...csvRows]
    .map(row => 
      row.map(field => {
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        const escaped = String(field).replace(/"/g, '""');
        if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
          return `"${escaped}"`;
        }
        return escaped;
      }).join(',')
    )
    .join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export function TreasurerDashboard() {
  const { profile } = useProfile();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [cycles, setCycles] = useState<DuesCycle[]>([]);
  const [assignments, setAssignments] = useState<DuesAssignment[]>([]);
  const [chapterMembers, setChapterMembers] = useState<ChapterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [showAssignDues, setShowAssignDues] = useState(false);
  const [showBulkAssignDues, setShowBulkAssignDues] = useState(false);
  const [showEditAssignment, setShowEditAssignment] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<DuesAssignment | null>(null);
  const [newCycle, setNewCycle] = useState({
    name: '',
    base_amount: 0,
    due_date: '',
    allow_payment_plans: false
  });
  const [newAssignment, setNewAssignment] = useState({
    memberId: '',
    amount: 0,
    status: 'required' as const,
    notes: ''
  });
  const [bulkAssignment, setBulkAssignment] = useState({
    selectedMembers: [] as string[],
    cycleId: '' as string,
    amount: 0,
    status: 'required' as 'required' | 'exempt' | 'reduced' | 'waived',
    notes: ''
  });

  useEffect(() => {
    if (profile?.chapter_id) {
      loadDuesData();
      loadChapterMembers();
    }
  }, [profile?.chapter_id]);

  const loadDuesData = async () => {
    try {
      setLoading(true);
      
      // Load cycles
      const { data: cyclesData } = await supabase
        .from('dues_cycles')
        .select('*')
        .eq('chapter_id', profile?.chapter_id)
        .order('created_at', { ascending: false });

      setCycles(cyclesData || []);

      // Load assignments
      const { data: assignmentsData } = await supabase
        .from('dues_assignments')
        .select(`
          *,
          user:profiles!dues_assignments_user_id_fkey(
            id,
            full_name,
            email,
            member_status
          ),
          cycle:dues_cycles!dues_assignments_dues_cycle_id_fkey(
            name,
            due_date
          )
        `)
        .eq('cycle.chapter_id', profile?.chapter_id);

      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error('Error loading dues data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChapterMembers = async () => {
    try {
      console.log('🔍 Loading chapter members for chapter_id:', profile?.chapter_id);
      
      const { data: membersData, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          email, 
          member_status, 
          current_dues_amount, 
          dues_status, 
          last_dues_assignment_date,
          role,
          chapter_role
        `)
        .eq('chapter_id', profile?.chapter_id)
        .in('role', ['admin', 'active_member']) // ✅ FIXED: Only fetch admin and active_member roles
        .order('full_name');

      if (error) {
        console.error('❌ Error loading chapter members:', error);
        return;
      }

      console.log('✅ Loaded chapter members:', membersData?.length || 0, 'members');
      console.log('📋 Sample member data:', membersData?.[0]);
      
      setChapterMembers(membersData || []);
    } catch (error) {
      console.error('❌ Error loading chapter members:', error);
    }
  };

  const handleCreateCycle = async () => {
    try {
      const response = await fetch('/api/dues/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCycle)
      });

      if (response.ok) {
        setShowCreateCycle(false);
        setNewCycle({ name: '', base_amount: 0, due_date: '', allow_payment_plans: false });
        loadDuesData();
      }
    } catch (error) {
      console.error('Error creating cycle:', error);
    }
  };

  const handleAssignDues = async () => {
    try {
      const response = await fetch('/api/dues/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: newAssignment.memberId,
          amount: newAssignment.amount,
          status: newAssignment.status,
          notes: newAssignment.notes,
          cycleId: cycles[0]?.id // Assign to current cycle
        })
      });

      if (response.ok) {
        setShowAssignDues(false);
        setNewAssignment({ memberId: '', amount: 0, status: 'required', notes: '' });
        loadDuesData();
        loadChapterMembers();
      }
    } catch (error) {
      console.error('Error assigning dues:', error);
    }
  };

  const handleBulkAssignDues = async () => {
    try {
      console.log(' Starting bulk dues assignment for', bulkAssignment.selectedMembers.length, 'members');
      console.log('📋 Selected cycle ID:', bulkAssignment.cycleId);
      
      // Check if we have a valid cycle selected
      if (!bulkAssignment.cycleId) {
        console.error('❌ No dues cycle selected. Please select a cycle first.');
        alert('Please select a dues cycle first.');
        return;
      }
      
      const promises = bulkAssignment.selectedMembers.map(memberId => 
        fetch('/api/dues/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId,
            amount: bulkAssignment.amount,
            status: bulkAssignment.status,
            notes: bulkAssignment.notes,
            cycleId: bulkAssignment.cycleId
          })
        })
      );

      const responses = await Promise.all(promises);
      const allSuccessful = responses.every(response => response.ok);

      if (allSuccessful) {
        setShowBulkAssignDues(false);
        setBulkAssignment({ selectedMembers: [], cycleId: '', amount: 0, status: 'required', notes: '' });
        loadDuesData();
        loadChapterMembers();
        console.log('✅ Bulk dues assignment completed successfully');
      } else {
        console.error('❌ Some bulk assignments failed');
      }
    } catch (error) {
      console.error('❌ Error in bulk dues assignment:', error);
    }
  };

  const handleEditAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      const response = await fetch('/api/dues/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          amount_assessed: selectedAssignment.amount_assessed,
          amount_due: selectedAssignment.amount_due,
          status: selectedAssignment.status,
          notes: selectedAssignment.notes
        })
      });

      if (response.ok) {
        setShowEditAssignment(false);
        setSelectedAssignment(null);
        loadDuesData();
        loadChapterMembers();
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this dues assignment? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/dues/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId })
      });

      if (response.ok) {
        loadDuesData();
        loadChapterMembers();
        console.log('✅ Dues assignment deleted successfully');
      } else {
        console.error('❌ Error deleting dues assignment');
        alert('Failed to delete dues assignment. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error deleting dues assignment:', error);
      alert('Failed to delete dues assignment. Please try again.');
    }
  };

  const handleMemberSelection = (memberId: string, checked: boolean) => {
    if (checked) {
      setBulkAssignment(prev => ({
        ...prev,
        selectedMembers: [...prev.selectedMembers, memberId]
      }));
    } else {
      setBulkAssignment(prev => ({
        ...prev,
        selectedMembers: prev.selectedMembers.filter(id => id !== memberId)
      }));
    }
  };

  const handleSelectAllMembers = (checked: boolean) => {
    if (checked) {
      setBulkAssignment(prev => ({
        ...prev,
        selectedMembers: chapterMembers.map(member => member.id)
      }));
    } else {
      setBulkAssignment(prev => ({
        ...prev,
        selectedMembers: []
      }));
    }
  };

  // Calculate financial overview from real data
  const financialOverview = {
    totalCollected: assignments.reduce((sum, a) => sum + a.amount_paid, 0),
    totalOutstanding: assignments.reduce((sum, a) => sum + (a.amount_due - a.amount_paid), 0),
    collectionRate: assignments.length > 0 ? 
      (assignments.reduce((sum, a) => sum + a.amount_paid, 0) / 
       assignments.reduce((sum, a) => sum + a.amount_assessed, 0)) * 100 : 0
  };

  // NEW: Calculate dues collection progress for current cycle
  const getCurrentCycle = () => {
    // Get the most recent active cycle
    return cycles.find(cycle => cycle.status === 'active') || cycles[0];
  };

  const getDuesCollectionProgress = () => {
    const currentCycle = getCurrentCycle();
    if (!currentCycle) {
      return {
        cycleName: 'No Active Cycle',
        paid: 0,
        pending: 0,
        overdue: 0,
        total: 0,
        collectionRate: 0
      };
    }

    // Filter assignments for current cycle
    const currentCycleAssignments = assignments.filter(
      assignment => assignment.cycle.name === currentCycle.name
    );

    const now = new Date();
    const dueDate = new Date(currentCycle.due_date);

    // Calculate counts
    const paid = currentCycleAssignments.filter(a => a.status === 'paid').length;
    const pending = currentCycleAssignments.filter(a => 
      a.status === 'required' && now <= dueDate
    ).length;
    const overdue = currentCycleAssignments.filter(a => 
      a.status === 'required' && now > dueDate
    ).length;

    const total = currentCycleAssignments.length;
    const collectionRate = total > 0 ? (paid / total) * 100 : 0;

    return {
      cycleName: currentCycle.name,
      paid,
      pending,
      overdue,
      total,
      collectionRate
    };
  };

  const duesProgress = getDuesCollectionProgress();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "required": return "bg-yellow-100 text-yellow-800";
      case "exempt": return "bg-gray-100 text-gray-800";
      case "waived": return "bg-blue-100 text-blue-800";
      case "reduced": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-0 sm:py-8">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-8">
        {/* Desktop Layout - Preserved */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden md:block"
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Total Collected</p>
                  <p className="text-2xl font-semibold text-green-900">${financialOverview.totalCollected.toLocaleString()}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden md:block"
        >
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Outstanding</p>
                  <p className="text-2xl font-semibold text-red-900">${financialOverview.totalOutstanding.toLocaleString()}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="hidden md:block"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Collection Rate</p>
                  <p className="text-2xl font-semibold text-blue-900">{financialOverview.collectionRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Mobile Layout - Single Row */}
      <div className="md:hidden mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2"
        >
          {/* Total Collected */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-base font-semibold text-green-900">${financialOverview.totalCollected.toLocaleString()}</p>
                <p className="text-green-600 text-xs font-medium">Collected</p>
              </div>
            </CardContent>
          </Card>

          {/* Outstanding */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-base font-semibold text-red-900">${financialOverview.totalOutstanding.toLocaleString()}</p>
                <p className="text-red-600 text-xs font-medium">Outstanding</p>
              </div>
            </CardContent>
          </Card>

          {/* Collection Rate */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center space-y-1">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <p className="text-base font-semibold text-blue-900">{financialOverview.collectionRate.toFixed(1)}%</p>
                <p className="text-blue-600 text-xs font-medium">Rate</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4 sm:mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { value: "overview", label: "Overview" },
            { value: "dues", label: "Member Dues" },
            { value: "members", label: "All Members" }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedTab(tab.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedTab === tab.value
                  ? "bg-white text-navy-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Desktop Layout - Dues Collection Progress (2/3 width) */}
          <Card className="hidden lg:block lg:col-span-2">
            <CardHeader>
              <CardTitle>Dues Collection Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>{duesProgress.cycleName}</span>
                  <span className="font-medium">{duesProgress.collectionRate.toFixed(1)}%</span>
                </div>
                <Progress value={duesProgress.collectionRate} className="h-3" />
                
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-green-600">
                      {duesProgress.paid}
                    </p>
                    <p className="text-sm text-gray-600">Paid</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-yellow-600">
                      {duesProgress.pending}
                    </p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-red-600">
                      {duesProgress.overdue}
                    </p>
                    <p className="text-sm text-gray-600">Overdue</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desktop Layout - Quick Actions Sidebar (1/3 width) */}
          <Card className="hidden lg:block lg:col-span-1">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setShowBulkAssignDues(true)} 
                className="w-full justify-start bg-purple-600 hover:bg-purple-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Bulk Assign Dues
              </Button>
              <Button 
                onClick={() => setShowAssignDues(true)} 
                className="w-full justify-start bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Dues
              </Button>
              <Button 
                onClick={() => setShowCreateCycle(true)} 
                className="w-full justify-start bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Dues Cycle
              </Button>
              <Button 
                onClick={() => exportDuesToCSV(assignments, `financial-report-${new Date().toISOString().split('T')[0]}.csv`)}
                className="w-full justify-start bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Financial Report
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start opacity-60 cursor-not-allowed" 
                disabled
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Create Payment Plans
                <Lock className="h-3 w-3 ml-2 text-gray-400" />
              </Button>
            </CardContent>
          </Card>

          {/* Mobile Layout - Dues Collection Progress */}
          <Card className="lg:hidden">
            <CardHeader className="pb-2">
              <CardTitle>Dues Collection Progress</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{duesProgress.cycleName}</span>
                  <span className="text-sm font-medium">{duesProgress.collectionRate.toFixed(1)}%</span>
                </div>
                <Progress value={duesProgress.collectionRate} className="h-2" />
                
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">
                      {duesProgress.paid}
                    </p>
                    <p className="text-xs text-gray-600">Paid</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-yellow-600">
                      {duesProgress.pending}
                    </p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-red-600">
                      {duesProgress.overdue}
                    </p>
                    <p className="text-xs text-gray-600">Overdue</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Layout - Quick Actions */}
          <Card className="lg:hidden">
            <CardHeader className="pb-2">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-2">
              <Button 
                onClick={() => setShowBulkAssignDues(true)} 
                className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-sm py-2"
              >
                <Users className="h-4 w-4 mr-2" />
                Bulk Assign Dues
              </Button>
              <Button 
                onClick={() => setShowAssignDues(true)} 
                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-sm py-2"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Dues
              </Button>
              <Button 
                onClick={() => setShowCreateCycle(true)} 
                className="w-full justify-start bg-green-600 hover:bg-green-700 text-sm py-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Dues Cycle
              </Button>
              <Button 
                onClick={() => exportDuesToCSV(assignments, `financial-report-${new Date().toISOString().split('T')[0]}.csv`)}
                className="w-full justify-start bg-green-600 hover:bg-green-700 text-sm py-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Financial Report
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start opacity-60 cursor-not-allowed text-sm py-2" 
                disabled
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Create Payment Plans
                <Lock className="h-3 w-3 ml-2 text-gray-400" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === "dues" && (
        <Card>
          <CardHeader className="pb-2 sm:pb-6">
            {/* Desktop Layout - Preserved */}
            <div className="hidden sm:flex justify-between items-center">
              <CardTitle>Member Dues Status</CardTitle>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => exportDuesToCSV(assignments, `dues-export-${new Date().toISOString().split('T')[0]}.csv`)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 opacity-60 cursor-not-allowed" 
                  disabled
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Reminders
                  <Lock className="h-3 w-3 ml-2 text-gray-400" />
                </Button>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="sm:hidden">
              <CardTitle className="text-lg mb-3">Member Dues Status</CardTitle>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => exportDuesToCSV(assignments, `dues-export-${new Date().toISOString().split('T')[0]}.csv`)}
                  className="flex-1 justify-center text-sm py-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 opacity-60 cursor-not-allowed flex-1 justify-center text-sm py-2" 
                  disabled
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Remind
                  <Lock className="h-3 w-3 ml-2 text-gray-400" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 sm:pt-6">
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium mb-2">No dues assignments</p>
                <p className="text-sm">No dues have been assigned to chapter members yet.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <div className="max-h-[70vh] overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-gray-50 z-10">
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium text-sm bg-gray-50">Member Name</th>
                            <th className="text-left p-3 font-medium text-sm bg-gray-50">Class</th>
                            <th className="text-left p-3 font-medium text-sm bg-gray-50">Amount</th>
                            <th className="text-left p-3 font-medium text-sm bg-gray-50">Status</th>
                            <th className="text-left p-3 font-medium text-sm bg-gray-50">Due Date</th>
                            <th className="text-left p-3 font-medium text-sm bg-gray-50">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignments.map((assignment) => (
                            <tr key={assignment.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div>
                                  <p className="font-medium">{assignment.user.full_name}</p>
                                  <p className="text-sm text-gray-600">{assignment.user.email}</p>
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline">{assignment.user.member_status}</Badge>
                              </td>
                              <td className="p-3">
                                <p className="font-medium">${assignment.amount_due.toFixed(2)}</p>
                                {assignment.amount_paid > 0 && (
                                  <p className="text-sm text-gray-600">Paid: ${assignment.amount_paid.toFixed(2)}</p>
                                )}
                              </td>
                              <td className="p-3">
                                <Badge className={getStatusColor(assignment.status)}>
                                  {assignment.status}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div>
                                  <p className="text-sm">{new Date(assignment.cycle.due_date).toLocaleDateString()}</p>
                                  {assignment.status === 'required' && new Date(assignment.cycle.due_date) < new Date() && (
                                    <p className="text-xs text-red-600 font-medium">Overdue</p>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAssignment(assignment);
                                      setShowEditAssignment(true);
                                    }}
                                    className="hover:bg-blue-50 hover:text-blue-600"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleDeleteAssignment(assignment.id)}
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Summary Footer */}
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Showing {assignments.length} dues assignments</p>
                  </div>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-3">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {assignment.user.full_name}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {assignment.user.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              {assignment.user.member_status}
                            </Badge>
                            <Badge className={`text-xs px-2 py-1 ${getStatusColor(assignment.status)}`}>
                              {assignment.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1 ml-2">
                          <p className="text-sm font-medium text-gray-900">
                            ${assignment.amount_due.toFixed(2)}
                          </p>
                          {assignment.amount_paid > 0 && (
                            <p className="text-xs text-gray-600">
                              Paid: ${assignment.amount_paid.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-600">
                          <span>Due: {new Date(assignment.cycle.due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}</span>
                          {assignment.status === 'required' && new Date(assignment.cycle.due_date) < new Date() && (
                            <span className="text-red-600 font-medium ml-2">(Overdue)</span>
                          )}
                        </div>
                        
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowEditAssignment(true);
                            }}
                            className="h-7 px-2 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {selectedTab === "members" && (
        <Card>
          <CardHeader className="pb-2 sm:pb-6">
            {/* Desktop Layout - Preserved */}
            <div className="hidden sm:flex justify-between items-center">
              <CardTitle>All Chapter Members ({chapterMembers.length})</CardTitle>
              <div className="flex space-x-2">
                <Button onClick={() => setShowBulkAssignDues(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Users className="h-4 w-4 mr-2" />
                  Bulk Assign Dues
                </Button>
                <Button onClick={() => setShowAssignDues(true)} className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Dues
                </Button>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="sm:hidden">
              <CardTitle className="text-lg mb-3">All Chapter Members ({chapterMembers.length})</CardTitle>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => setShowBulkAssignDues(true)} 
                  className="bg-purple-600 hover:bg-purple-700 flex-1 justify-center text-sm py-2"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Bulk Assign
                </Button>
                <Button 
                  onClick={() => setShowAssignDues(true)} 
                  className="bg-blue-600 hover:bg-blue-700 flex-1 justify-center text-sm py-2"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Dues
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 sm:pt-6">
            {chapterMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium mb-2">No chapter members</p>
                <p className="text-sm">No active members found in this chapter.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <div className="max-h-[70vh] overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-gray-50 z-10">
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium text-sm bg-gray-50">Member Info</th>
                            <th className="text-left p-3 font-medium text-sm bg-gray-50">Role & Status</th>
                            <th className="text-left p-3 font-medium text-sm bg-gray-50">Dues Information</th>
                            <th className="text-left p-3 font-medium text-sm bg-gray-50">Last Assignment</th>
                            <th className="text-left p-3 font-medium text-sm bg-gray-50">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chapterMembers.map((member) => (
                            <tr key={member.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div>
                                  <p className="font-medium">{member.full_name}</p>
                                  <p className="text-sm text-gray-600">{member.email}</p>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  <Badge variant="secondary">{member.chapter_role || member.role}</Badge>
                                  <Badge variant="outline">{member.member_status}</Badge>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  <p className="font-medium">${member.current_dues_amount.toFixed(2)}</p>
                                  <Badge className={getStatusColor(member.dues_status)}>
                                    {member.dues_status}
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-3">
                                <p className="text-sm text-gray-600">
                                  {member.last_dues_assignment_date 
                                    ? new Date(member.last_dues_assignment_date).toLocaleDateString()
                                    : 'Never'
                                  }
                                </p>
                              </td>
                              <td className="p-3">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setNewAssignment({
                                      memberId: member.id,
                                      amount: member.current_dues_amount,
                                      status: 'required',
                                      notes: ''
                                    });
                                    setShowAssignDues(true);
                                  }}
                                  className="hover:bg-green-50 hover:text-green-600"
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Assign Dues
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Summary Footer */}
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Showing {chapterMembers.length} chapter members</p>
                  </div>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-3">
                  {chapterMembers.map((member) => (
                    <div key={member.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {member.full_name}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {member.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              {member.chapter_role || member.role}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              {member.member_status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1 ml-2">
                          <p className="text-sm font-medium text-gray-900">
                            ${member.current_dues_amount.toFixed(2)}
                          </p>
                          <Badge className={`text-xs px-2 py-1 ${getStatusColor(member.dues_status)}`}>
                            {member.dues_status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-600">
                          <span>
                            Last assigned: {member.last_dues_assignment_date 
                              ? new Date(member.last_dues_assignment_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : 'Never'
                            }
                          </span>
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setNewAssignment({
                              memberId: member.id,
                              amount: member.current_dues_amount,
                              status: 'required',
                              notes: ''
                            });
                            setShowAssignDues(true);
                          }}
                          className="h-7 px-2 text-xs hover:bg-green-50 hover:text-green-600"
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Assign
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Cycle Dialog */}
      <Dialog open={showCreateCycle} onOpenChange={setShowCreateCycle}>
        <DialogContent className="bg-white border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle>Create New Dues Cycle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Cycle Name</Label>
              <Input
                id="name"
                value={newCycle.name}
                onChange={(e) => setNewCycle({ ...newCycle, name: e.target.value })}
                placeholder="e.g., Spring 2024"
              />
            </div>
            <div>
              <Label htmlFor="amount">Base Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={newCycle.base_amount}
                onChange={(e) => setNewCycle({ ...newCycle, base_amount: parseFloat(e.target.value) || 0 })}
                placeholder="150.00"
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={newCycle.due_date}
                onChange={(e) => setNewCycle({ ...newCycle, due_date: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="paymentPlans"
                checked={newCycle.allow_payment_plans}
                onChange={(e) => setNewCycle({ ...newCycle, allow_payment_plans: e.target.checked })}
              />
              <Label htmlFor="paymentPlans">Allow Payment Plans</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateCycle(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCycle} className="bg-green-600 hover:bg-green-700">
                Create Cycle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dues Dialog */}
      <Dialog open={showAssignDues} onOpenChange={setShowAssignDues}>
        <DialogContent className="bg-white border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle>Assign Dues to Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="member">Select Member</Label>
              <Select
                value={newAssignment.memberId}
                onValueChange={(value) => setNewAssignment({ ...newAssignment, memberId: value })}
              >
                <SelectItem value="">Choose a member</SelectItem>
                {chapterMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name} ({member.email})
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Dues Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={newAssignment.amount}
                onChange={(e) => setNewAssignment({ ...newAssignment, amount: parseFloat(e.target.value) || 0 })}
                placeholder="150.00"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={newAssignment.status}
                onValueChange={(value: any) => setNewAssignment({ ...newAssignment, status: value })}
              >
                <SelectItem value="required">Required</SelectItem>
                <SelectItem value="exempt">Exempt</SelectItem>
                <SelectItem value="reduced">Reduced</SelectItem>
                <SelectItem value="waived">Waived</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newAssignment.notes}
                onChange={(e) => setNewAssignment({ ...newAssignment, notes: e.target.value })}
                placeholder="Optional notes about this assignment"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAssignDues(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignDues} className="bg-blue-600 hover:bg-blue-700">
                Assign Dues
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dues Dialog */}
      <Dialog open={showBulkAssignDues} onOpenChange={setShowBulkAssignDues}>
        <DialogContent className="w-auto max-w-7xl h-[90vh] bg-white border border-gray-200 shadow-lg p-0 flex flex-col">
          {/* DialogHeader with DialogTitle for accessibility */}
          <DialogHeader className="flex items-left justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold text-navy-900">Assign Dues to Members</DialogTitle>
          </DialogHeader>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
            <div className="space-y-2">
              {/* Select All Header */}
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Checkbox
                  id="selectAll"
                  checked={bulkAssignment.selectedMembers.length === chapterMembers.length}
                  onCheckedChange={handleSelectAllMembers}
                />
                <Label htmlFor="selectAll" className="font-medium">
                  Select All Members ({chapterMembers.length})
                </Label>
              </div>
              
              {/* Members Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-200 hover:bg-gray-50">
                      <TableHead className="bg-gray-50 border-r border-gray-200 w-12">
                        <div className="flex justify-center items-center h-full p-2">
                          <Checkbox
                            checked={bulkAssignment.selectedMembers.length === chapterMembers.length}
                            onCheckedChange={handleSelectAllMembers}
                            indeterminate={bulkAssignment.selectedMembers.length > 0 && bulkAssignment.selectedMembers.length < chapterMembers.length}
                            className="data-[state=checked]:bg-navy-600 data-[state=checked]:border-navy-600"
                          />
                        </div>
                      </TableHead>
                      <TableHead className="bg-gray-50 border-r border-gray-200">
                        <span className="font-medium text-gray-900">NAME</span>
                      </TableHead>
                      <TableHead className="bg-gray-50">
                        <span className="font-medium text-gray-900">EMAIL</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chapterMembers.map((member) => (
                      <TableRow 
                        key={member.id} 
                        className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                          bulkAssignment.selectedMembers.includes(member.id) ? 'bg-navy-50 border-navy-200' : ''
                        }`}
                      >
                        {/* Checkbox Column */}
                        <TableCell className="bg-white border-r border-gray-200 w-12">
                          <div className="flex justify-center items-center h-full p-2">
                            <Checkbox
                              checked={bulkAssignment.selectedMembers.includes(member.id)}
                              onCheckedChange={(checked) => handleMemberSelection(member.id, checked as boolean)}
                              className="data-[state=checked]:bg-navy-600 data-[state=checked]:border-navy-600"
                            />
                          </div>
                        </TableCell>
                        
                        {/* Name Column */}
                        <TableCell className="bg-white border-r border-gray-200">
                          <div className="flex items-start space-x-3">
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-sm font-medium">
                                {member.full_name?.[0] || ''}{member.full_name?.split(' ')[1]?.[0] || ''}
                              </span>
                            </div>
                            
                            {/* Name */}
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-gray-900 break-words">
                                {member.full_name}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Email Column */}
                        <TableCell className="bg-white">
                          <span className="text-gray-900 text-sm">{member.email}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Assignment Details */}
              <div className="border-t pt-4 space-y-4">
                {/* Add Cycle Selection */}
                <div>
                  <Label htmlFor="bulkCycle">Dues Cycle</Label>
                  <Select 
                    value={bulkAssignment.cycleId || ''} 
                    onValueChange={(value: string) => setBulkAssignment({ ...bulkAssignment, cycleId: value })}
                    placeholder="Select a dues cycle"
                  >
                    <SelectItem value="">Select a dues cycle</SelectItem>
                    {cycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.name} - ${cycle.base_amount} (Due: {new Date(cycle.due_date).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </Select>
                  {cycles.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      No dues cycles available. Please create a cycle first.
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="bulkAmount">Dues Amount ($)</Label>
                  <Input
                    id="bulkAmount"
                    type="number"
                    step="5"
                    min="0"
                    value={bulkAssignment.amount}
                    onChange={(e) => setBulkAssignment({ ...bulkAssignment, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="150.00"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="bulkStatus">Status</Label>
                  <Select 
                    value={bulkAssignment.status} 
                    onValueChange={(value: string) => setBulkAssignment({ ...bulkAssignment, status: value as 'required' | 'exempt' | 'reduced' | 'waived' })}
                    placeholder="Select status"
                  >
                    <SelectItem value="">Select status</SelectItem>
                    <SelectItem value="required">Required</SelectItem>
                    <SelectItem value="exempt">Exempt</SelectItem>
                    <SelectItem value="reduced">Reduced</SelectItem>
                    <SelectItem value="waived">Waived</SelectItem>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bulkNotes">Notes</Label>
                  <Textarea
                    id="bulkNotes"
                    value={bulkAssignment.notes}
                    onChange={(e) => setBulkAssignment({ ...bulkAssignment, notes: e.target.value })}
                    placeholder="Optional notes about this assignment"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Persistent Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 flex-shrink-0">
            <p className="text-sm text-gray-600">
              Selected: {bulkAssignment.selectedMembers.length} members
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowBulkAssignDues(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkAssignDues} 
                className="bg-purple-600 hover:bg-purple-700"
                disabled={bulkAssignment.selectedMembers.length === 0 || !bulkAssignment.cycleId}
              >
                Assign Dues to {bulkAssignment.selectedMembers.length} Members
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={showEditAssignment} onOpenChange={setShowEditAssignment}>
        <DialogContent className="bg-white border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle>Edit Dues Assignment</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-4">
              <div>
                <Label>Member</Label>
                <p className="text-sm text-gray-600">{selectedAssignment.user.full_name}</p>
              </div>
              <div>
                <Label htmlFor="editAmount">Amount Due ($)</Label>
                <Input
                  id="editAmount"
                  type="number"
                  value={selectedAssignment.amount_due}
                  onChange={(e) => setSelectedAssignment({
                    ...selectedAssignment,
                    amount_due: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={selectedAssignment.status}
                  onValueChange={(value: any) => setSelectedAssignment({
                    ...selectedAssignment,
                    status: value
                  })}
                >
                  <SelectItem value="required">Required</SelectItem>
                  <SelectItem value="exempt">Exempt</SelectItem>
                  <SelectItem value="reduced">Reduced</SelectItem>
                  <SelectItem value="waived">Waived</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </Select>
              </div>
              <div>
                <Label htmlFor="editNotes">Notes</Label>
                <Textarea
                  id="editNotes"
                  value={selectedAssignment.notes || ''}
                  onChange={(e) => setSelectedAssignment({
                    ...selectedAssignment,
                    notes: e.target.value
                  })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditAssignment(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditAssignment} className="bg-green-600 hover:bg-green-700">
                  Update Assignment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
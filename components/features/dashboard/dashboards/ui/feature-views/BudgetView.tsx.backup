'use client';

import { useState, useMemo, useEffect } from "react";
import { DollarSign, Calendar, Users, ChevronLeft, ChevronRight, Edit2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProfile } from "@/lib/contexts/ProfileContext";
import { useEvents } from "@/lib/hooks/useEvents";
import { useChapterBudget } from "@/lib/hooks/useChapterBudget";

export function BudgetView() {
  // Get user profile and chapter ID
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 8;
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editBudgetValue, setEditBudgetValue] = useState<string>('');

  // Use budget hook
  const { 
    startingBudget, 
    loading: budgetLoading, 
    canEdit, 
    saving, 
    updateBudget,
    refetch: refetchBudget 
  } = useChapterBudget();

  // Use events hook
  const { 
    events, 
    loading: eventsLoading, 
    error: eventsError
  } = useEvents({ 
    chapterId: chapterId || '', 
    scope: 'all' 
  });

  // Calculate budget data
  const budgetData = useMemo(() => {
    if (!events || events.length === 0) {
      return {
        totalAllocated: 0,
        totalSpent: 0,
        remaining: 0,
        categories: [],
        eventsWithBudget: [],
        startingBudget: startingBudget
      };
    }

    // Filter events that have budget amounts
    const eventsWithBudget = events.filter(event => 
      event.budget_amount && parseFloat(String(event.budget_amount)) > 0
    );

    // Calculate totals
    const totalAllocated = eventsWithBudget.reduce((sum, event) => 
      sum + parseFloat(String(event.budget_amount || '0')), 0
    );

    // For MVP, we'll assume spent = allocated (since we don't have expense tracking yet)
    const totalSpent = totalAllocated;
    
    // Calculate remaining budget by subtracting allocated from starting budget
    const remaining = startingBudget - totalAllocated;

    // Create categories based on budget_label or event title patterns
    const categoryMap = new Map<string, { allocated: number; events: any[] }>();

    eventsWithBudget.forEach(event => {
      // Determine category based on budget_label or event title
      let category = 'General Events';
      
      if (event.budget_label) {
        // Use budget_label if available
        category = event.budget_label;
      } else if (event.title) {
        // Infer category from title
        const title = event.title.toLowerCase();
        if (title.includes('formal') || title.includes('dance') || title.includes('party')) {
          category = 'Formal Events';
        } else if (title.includes('alumni') || title.includes('mixer')) {
          category = 'Alumni Events';
        } else if (title.includes('recruitment') || title.includes('rush')) {
          category = 'Recruitment';
        } else if (title.includes('brotherhood') || title.includes('bonding')) {
          category = 'Brotherhood Events';
        } else if (title.includes('meeting') || title.includes('onboarding')) {
          category = 'Meetings & Planning';
        }
      }

      // Add to category
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { allocated: 0, events: [] });
      }
      
      const categoryData = categoryMap.get(category)!;
      categoryData.allocated += parseFloat(String(event.budget_amount || '0'));
      categoryData.events.push(event);
    });

    // Convert to array format for display
    const categories = Array.from(categoryMap.entries()).map(([categoryName, data]) => ({
      category: categoryName,
      allocated: data.allocated,
      spent: data.allocated, // MVP: spent = allocated
      remaining: 0, // MVP: no expenses tracked yet
      events: data.events
    }));

    return {
      totalAllocated,
      totalSpent,
      remaining,
      categories,
      eventsWithBudget,
      startingBudget: startingBudget
    };
  }, [events, startingBudget]);

  // Calculate pagination
  const totalPages = Math.ceil((events?.length || 0) / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const paginatedEvents = events?.slice(startIndex, endIndex) || [];

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to page 1 when events change
  useEffect(() => {
    setCurrentPage(1);
  }, [events?.length]);

  // Handle edit dialog open
  const handleEditClick = () => {
    setEditBudgetValue(startingBudget.toString());
    setShowEditDialog(true);
  };

  // Handle save budget
  const handleSaveBudget = async () => {
    const newBudget = parseFloat(editBudgetValue);
    if (isNaN(newBudget) || newBudget < 0) {
      return; // Validation handled by hook
    }

    const success = await updateBudget(newBudget);
    if (success) {
      setShowEditDialog(false);
      // Refetch budget to ensure UI is updated
      refetchBudget();
    }
  };

  if (eventsLoading || budgetLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading budget data...</p>
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading budget data: {eventsError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards - Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20 transition-all duration-300 hover:shadow-xl hover:shadow-navy-100/30 hover:scale-[1.02] hover:bg-white/90">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy-700">Total Budget Allocated</p>
                <p className="text-xl md:text-2xl font-semibold text-navy-900">
                  ${budgetData.totalAllocated.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-navy-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20 transition-all duration-300 hover:shadow-xl hover:shadow-navy-100/30 hover:scale-[1.02] hover:bg-white/90">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy-700">Events with Budgets</p>
                <p className="text-xl md:text-2xl font-semibold text-navy-900">
                  {budgetData.eventsWithBudget.length}
                </p>
              </div>
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-navy-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20 transition-all duration-300 hover:shadow-xl hover:shadow-navy-100/30 hover:scale-[1.02] hover:bg-white/90">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy-700">Total Events</p>
                <p className="text-xl md:text-2xl font-semibold text-navy-900">
                  {events?.length || 0}
                </p>
              </div>
              <Users className="h-6 w-6 md:h-8 md:w-8 text-navy-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Overview Card */}
      <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20">
        <CardHeader className="pb-2 md:pb-2 border-b border-navy-100/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg md:text-xl text-navy-900">
              <DollarSign className="h-5 w-5 mr-2 text-navy-600" />
              Budget Overview
            </CardTitle>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                className="rounded-full h-8 px-2 text-gray-600 hover:text-navy-900 hover:bg-gray-100"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit Budget
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-2 md:pt-2">
          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Starting Budget</span>
              <span className="font-semibold">${budgetData.startingBudget?.toLocaleString() || '12,000'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Allocated</span>
              <span className="font-semibold text-orange-600">${budgetData.totalAllocated.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Remaining</span>
              <span className="font-semibold text-green-600">${budgetData.remaining.toLocaleString()}</span>
            </div>
            <Progress 
              value={(budgetData.totalAllocated / Math.max(budgetData.startingBudget || 12000, 1)) * 100} 
              className="h-2"
            />
            <p className="text-xs text-gray-500 text-center">
              {budgetData.startingBudget ? 
                `${((budgetData.totalAllocated / budgetData.startingBudget) * 100).toFixed(1)}% of budget allocated`
                : 'Budget tracking enabled'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Budget Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Starting Budget</DialogTitle>
            <DialogDescription>
              Update the starting budget for your chapter. This will affect all budget calculations.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="budget" className="text-sm font-medium">
                Starting Budget ($)
              </label>
              <Input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                value={editBudgetValue}
                onChange={(e) => setEditBudgetValue(e.target.value)}
                placeholder="12000.00"
                className="text-base"
              />
              <p className="text-xs text-gray-500">
                Enter the total starting budget amount for the chapter.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={saving}
              className="rounded-full bg-white/80 backdrop-blur-md border border-grey-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveBudget}
              disabled={saving || !editBudgetValue || parseFloat(editBudgetValue) < 0}
              className="text-sm whitespace-nowrap rounded-full bg-white/80 backdrop-blur-md border border-navy-300/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* All Events Budget Summary */}
      <Card className="bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20">
        <CardHeader className="pb-2 md:pb-6 border-b border-navy-100/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl">All Events Budget Summary</CardTitle>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {events?.length || 0} {events?.length === 1 ? 'event' : 'events'}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="h-8 px-3 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 p-0 text-xs flex-shrink-0 ${
                          currentPage === page
                            ? 'bg-navy-600 text-white hover:bg-navy-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="h-8 px-3 text-xs"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2 md:pt-6">
          {events && events.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <p className="text-gray-500 text-sm md:text-base">No events found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedEvents.map((event, index) => (
                <div key={event.id || index} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <span className="font-medium">{event.title}</span>
                    <span className="text-gray-500 ml-2">• {event.status}</span>
                  </div>
                  <div className="text-right">
                    {event.budget_amount ? (
                      <span className="font-medium text-green-600">
                        ${parseFloat(String(event.budget_amount)).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">No budget</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

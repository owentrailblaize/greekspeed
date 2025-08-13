'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, AlertTriangle } from 'lucide-react';

// Mock data for documents
const documentsData = [
  {
    id: 1,
    title: "Meeting Minutes - March 15",
    owner: "Sarah Johnson",
    updatedAt: "2 hours ago"
  },
  {
    id: 2,
    title: "Event Budget Sheet",
    owner: "Michael Chen",
    updatedAt: "1 day ago"
  },
  {
    id: 3,
    title: "Community Service Log",
    owner: "Alex Thompson",
    updatedAt: "2 days ago"
  }
];

// Mock data for compliance checklist
const complianceData = {
  checklistTitle: "Spring 2024 Compliance",
  completed: 8,
  total: 12,
  overdueItems: [
    { id: 1, title: "Submit financial report", dueDate: "March 20, 2024" },
    { id: 2, title: "Update member roster", dueDate: "March 25, 2024" }
  ]
};

export function DocsCompliancePanel() {
  const [activeTab, setActiveTab] = useState('documents');

  const handleUpload = () => {
    console.log('Upload document');
    // TODO: Open document upload modal
  };

  const completionPercentage = (complianceData.completed / complianceData.total) * 100;

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <FileText className="h-5 w-5 text-navy-600" />
          <span>Docs & Compliance</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents" className="space-y-4">
            <div className="space-y-3">
              {documentsData.map((doc) => (
                <div key={doc.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">{doc.title}</h4>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>Owner: {doc.owner}</div>
                    <div>Updated: {doc.updatedAt}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={handleUpload}
              className="w-full bg-navy-600 hover:bg-navy-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </TabsContent>
          
          <TabsContent value="compliance" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-medium text-gray-900 text-sm mb-2">{complianceData.checklistTitle}</h4>
                <div className="text-2xl font-bold text-navy-600">{complianceData.completed}/{complianceData.total}</div>
                <div className="text-sm text-gray-600">items completed</div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-gray-900 font-medium">{completionPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-navy-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              {complianceData.overdueItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Overdue Items</span>
                  </div>
                  {complianceData.overdueItems.map((item) => (
                    <div key={item.id} className="p-2 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm text-red-800 font-medium">{item.title}</div>
                      <div className="text-xs text-red-600">Due: {item.dueDate}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Button variant="outline" className="w-full text-navy-600 border-navy-600 hover:bg-navy-50">
              View Full Checklist
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 
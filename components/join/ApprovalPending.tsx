'use client';
import { motion } from 'framer-motion';
import { Clock, Users, Shield, CheckCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Invitation } from '@/types/invitations';

interface ApprovalPendingProps {
  invitation: Invitation;
  onClose: () => void;
}

export function ApprovalPending({ invitation, onClose }: ApprovalPendingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl flex items-center justify-center space-x-2">
              <Clock className="h-6 w-6 text-orange-600" />
              <span>Approval Pending</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Your account is pending approval
              </h3>
              <p className="text-gray-600">
                Your account has been created successfully, but requires admin approval before you can access the {invitation.chapter_name} dashboard.
              </p>
            </div>

            {/* What happens next */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-900 mb-3">What happens next?</h4>
              <div className="space-y-2 text-sm text-orange-800">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-orange-600" />
                  <span>Your account is created and ready</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-orange-600" />
                  <span>Chapter administrators will review your request</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-orange-600" />
                  <span>You'll receive an email notification once approved</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-orange-600" />
                  <span>You can then log in and access the dashboard</span>
                </div>
              </div>
            </div>

            {/* Chapter Information */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-3">Chapter Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-purple-800">Chapter: {invitation.chapter_name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <span className="text-purple-800">Role: Active Member (Pending)</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
              <p className="text-sm text-blue-800">
                If you have any questions or need assistance, please contact the chapter administrators. 
                They can help you with the approval process or answer any questions about joining the chapter.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = '/auth/sign-in'}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                Sign In to Check Status
              </Button>
              
              <div className="text-center">
                <button
                  onClick={onClose}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1 mx-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Return to Home</span>
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Typical Timeline</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Immediate: Account created and pending approval</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span>1-3 days: Admin review and approval</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span>After approval: Full access to chapter features</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


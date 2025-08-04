'use client';

import Link from 'next/link';
import * as React from 'react';
import { Users, DollarSign, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

const features: Feature[] = [
  {
    icon: <Users className="h-6 w-6 text-navy-600" />,
    title: 'Alumni Network',
    description: 'Connect with alumni across industries',
    href: '/dashboard/alumni',
  },
  {
    icon: <DollarSign className="h-6 w-6 text-navy-600" />,
    title: 'Dues Management',
    description: 'Manage member dues and finances',
    href: '/dashboard/dues',
  },
  {
    icon: <Shield className="h-6 w-6 text-navy-600" />,
    title: 'Executive Admin',
    description: 'Tools for chapter leadership',
    href: '/dashboard/admin',
  },
];

export function DashboardOverview() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((feat) => (
        <Card key={feat.title} className="bg-white border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6 flex flex-col space-y-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-navy-50">
              {feat.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{feat.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{feat.description}</p>
            </div>
            <Link href={feat.href} className="inline-block">
              <Button className="bg-navy-600 hover:bg-navy-700 text-white w-full">Go to {feat.title}</Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 
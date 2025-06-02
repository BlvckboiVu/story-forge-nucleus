
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function TestPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Test Page</h1>
        <p className="text-muted-foreground">Administrative tools and testing interface</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Current authenticated user details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>ID:</strong> {user?.id}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {user?.role}</p>
              <p><strong>Status:</strong> {user?.isOnline ? 'Online' : 'Offline'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Application health and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Database Connection</span>
                <span className="text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Authentication</span>
                <span className="text-green-600">Active</span>
              </div>
              <Button className="w-full">Run System Check</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

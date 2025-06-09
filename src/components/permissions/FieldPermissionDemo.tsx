
import React from 'react';
import { FieldPermissionWrapper } from '@/components/auth/FieldPermissionWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export const FieldPermissionDemo: React.FC = () => {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Permission-Controlled Form Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldPermissionWrapper
          elementKey="case_title"
          permissionType="view"
          fallback={<div className="text-muted-foreground">No permission to view case title</div>}
        >
          <div className="space-y-2">
            <Label htmlFor="title">Case Title</Label>
            <FieldPermissionWrapper
              elementKey="case_title"
              permissionType="edit"
              fallback={
                <Input 
                  id="title" 
                  value="Sample Case Title" 
                  disabled 
                  className="bg-muted" 
                />
              }
            >
              <Input 
                id="title" 
                placeholder="Enter case title" 
                defaultValue="Sample Case Title"
              />
            </FieldPermissionWrapper>
          </div>
        </FieldPermissionWrapper>

        <FieldPermissionWrapper
          elementKey="case_description"
          permissionType="view"
          fallback={<div className="text-muted-foreground">No permission to view case description</div>}
        >
          <div className="space-y-2">
            <Label htmlFor="description">Case Description</Label>
            <FieldPermissionWrapper
              elementKey="case_description"
              permissionType="edit"
              fallback={
                <Textarea 
                  id="description" 
                  value="Sample case description..." 
                  disabled 
                  className="bg-muted" 
                />
              }
            >
              <Textarea 
                id="description" 
                placeholder="Enter case description" 
                defaultValue="Sample case description..."
              />
            </FieldPermissionWrapper>
          </div>
        </FieldPermissionWrapper>

        <FieldPermissionWrapper
          elementKey="case_status"
          permissionType="view"
          fallback={<div className="text-muted-foreground">No permission to view case status</div>}
        >
          <div className="space-y-2">
            <Label htmlFor="status">Case Status</Label>
            <FieldPermissionWrapper
              elementKey="case_status"
              permissionType="edit"
              fallback={
                <Input 
                  id="status" 
                  value="Open" 
                  disabled 
                  className="bg-muted" 
                />
              }
            >
              <Input 
                id="status" 
                placeholder="Enter case status" 
                defaultValue="Open"
              />
            </FieldPermissionWrapper>
          </div>
        </FieldPermissionWrapper>

        <div className="flex gap-2">
          <FieldPermissionWrapper
            elementKey="edit_case_btn"
            permissionType="view"
          >
            <Button variant="default">
              Save Changes
            </Button>
          </FieldPermissionWrapper>

          <FieldPermissionWrapper
            elementKey="close_case_btn"
            permissionType="view"
          >
            <Button variant="destructive">
              Close Case
            </Button>
          </FieldPermissionWrapper>
        </div>
      </CardContent>
    </Card>
  );
};

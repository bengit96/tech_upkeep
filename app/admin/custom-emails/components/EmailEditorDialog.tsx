import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import type { CreateCustomEmailRequest } from "@/lib/types/custom-email";

interface EmailEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CreateCustomEmailRequest;
  setFormData: (data: CreateCustomEmailRequest) => void;
  isLoading: boolean;
  isEditing: boolean;
  onSave: () => void;
}

export default function EmailEditorDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  isLoading,
  isEditing,
  onSave,
}: EmailEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? "Edit Email" : "Create New Email"}
          </DialogTitle>
          <DialogDescription>
            Create a custom email to send to your subscribers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Email Name (Internal)</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Product Launch Announcement"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Your email subject line"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="preheader">Preview Text (Optional)</Label>
            <Input
              id="preheader"
              value={formData.preheaderText}
              onChange={(e) =>
                setFormData({ ...formData, preheaderText: e.target.value })
              }
              placeholder="Preview text shown in inbox"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="content">Email Content (HTML)</Label>
            <Textarea
              id="content"
              value={formData.htmlContent}
              onChange={(e) =>
                setFormData({ ...formData, htmlContent: e.target.value })
              }
              placeholder="Enter your HTML email content..."
              rows={12}
              className="bg-gray-800 border-gray-700 text-white font-mono text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="tracking"
              checked={formData.includeTracking}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, includeTracking: checked as boolean })
              }
            />
            <Label htmlFor="tracking" className="cursor-pointer">
              Include open tracking
            </Label>
          </div>

          <div>
            <Label>Target Audience</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="allUsers"
                checked={formData.targetAudience?.allUsers}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    targetAudience: { allUsers: checked as boolean },
                  })
                }
              />
              <Label htmlFor="allUsers" className="cursor-pointer">
                Send to all active users
              </Label>
            </div>
            {!formData.targetAudience?.allUsers && (
              <p className="text-sm text-gray-400 mt-2">
                Advanced filtering coming soon...
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Draft"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

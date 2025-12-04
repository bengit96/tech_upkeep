import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send } from "lucide-react";
import { useSendCustomEmail } from "@/lib/hooks/use-custom-emails";
import type { CustomEmailDraft } from "@/lib/types/custom-email";

interface EmailSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: CustomEmailDraft;
  getTargetDescription: (targetAudience: string | null) => string;
  onSuccess: () => void;
}

export default function EmailSendDialog({
  open,
  onOpenChange,
  draft,
  getTargetDescription,
  onSuccess,
}: EmailSendDialogProps) {
  const [testMode, setTestMode] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const { sendEmail, isSending } = useSendCustomEmail(draft.id);

  const handleSend = async () => {
    setMessage(null);

    try {
      const result = await sendEmail({
        testMode,
        testEmail: testMode ? testEmail : undefined,
      });

      setMessage({
        type: "success",
        text: testMode
          ? `Test email sent to ${testEmail}`
          : `Email sent to ${result.sent} users (${result.failed} failed)`,
      });

      setTimeout(() => {
        onSuccess();
        setTestMode(false);
        setTestEmail("");
        setMessage(null);
      }, 2000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to send email" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Send Email</DialogTitle>
          <DialogDescription>
            Send "{draft.subject}" to your subscribers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="testMode"
              checked={testMode}
              onCheckedChange={(checked) => setTestMode(checked as boolean)}
            />
            <Label htmlFor="testMode" className="cursor-pointer">
              Send test email first
            </Label>
          </div>

          {testMode && (
            <div>
              <Label htmlFor="testEmail">Test Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          )}

          {!testMode && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
              <p className="text-yellow-400 text-sm">
                This will send the email to{" "}
                <strong>{getTargetDescription(draft.targetAudience)}</strong>. This
                action cannot be undone.
              </p>
            </div>
          )}

          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || (testMode && !testEmail)}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {testMode ? "Send Test" : "Send Email"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

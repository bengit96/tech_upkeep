import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mail,
  Send,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Users,
} from "lucide-react";
import type { CustomEmailDraft } from "@/lib/types/custom-email";

interface EmailDraftCardProps {
  draft: CustomEmailDraft;
  getTargetDescription: (targetAudience: string | null) => string;
  onPreview: () => void;
  onEdit: () => void;
  onSend: () => void;
  onDelete: () => void;
}

export default function EmailDraftCard({
  draft,
  getTargetDescription,
  onPreview,
  onEdit,
  onSend,
  onDelete,
}: EmailDraftCardProps) {
  return (
    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:border-gray-600 transition-all">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {draft.name}
              {draft.status === "sent" && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  Sent
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              <div className="font-semibold">{draft.subject}</div>
              {draft.preheaderText && (
                <div className="text-sm mt-1">{draft.preheaderText}</div>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onPreview}>
              <Eye className="w-4 h-4" />
            </Button>
            {draft.status === "draft" && (
              <>
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSend}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {getTargetDescription(draft.targetAudience)}
          </div>
          {draft.sentCount > 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Sent to {draft.sentCount} users
            </div>
          )}
          <div>Created: {new Date(draft.createdAt).toLocaleDateString()}</div>
          {draft.sentAt && (
            <div>Sent: {new Date(draft.sentAt).toLocaleDateString()}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

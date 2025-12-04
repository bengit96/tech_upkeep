import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  htmlContent: string;
}

export default function EmailPreviewDialog({
  open,
  onOpenChange,
  htmlContent,
}: EmailPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Email Preview</DialogTitle>
        </DialogHeader>
        <div className="bg-white rounded-lg overflow-auto max-h-[70vh]">
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

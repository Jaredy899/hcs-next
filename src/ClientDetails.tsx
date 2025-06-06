import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect } from "react";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";
import { ContactInformationSection } from "./components/ContactInformationSection";
import { ImportantDatesSection } from "./components/ImportantDatesSection";
import { ContactStatusSection } from "./components/ContactStatusSection";
import { TodoSection } from "./components/TodoSection";
import { NotesSection } from "./components/NotesSection";
import { LastContactSection } from "./components/LastContactSection";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Archive } from "lucide-react";
import { usePendingChanges } from "./hooks/usePendingChanges";

export function ClientDetails({
  clientId,
  onClose,
}: {
  clientId: Id<"clients">;
  onClose: () => void;
}) {
  const client = useQuery(api.clients.list)?.find((c) => c._id === clientId);
  const archiveClient = useMutation(api.clients.archive);
  const pendingChanges = usePendingChanges();

  const handleClose = async () => {
    if (pendingChanges.hasPendingChanges) {
      try {
        await pendingChanges.syncChanges();
        toast.success("Changes saved");
      } catch (error) {
        toast.error("Failed to save changes");
        return; // Don't close if sync failed
      }
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        await handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  if (!client) return null;

  const handleArchive = async () => {
    if (confirm("Are you sure you want to archive this consumer?")) {
      // Sync any pending changes before archiving
      if (pendingChanges.hasPendingChanges) {
        try {
          await pendingChanges.syncChanges();
        } catch (error) {
          toast.error("Failed to save pending changes");
          return;
        }
      }
      await archiveClient({ id: clientId });
      toast.success("Consumer archived");
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2"
      onClick={handleClose}
    >
      <div 
        className="bg-background rounded-lg shadow-lg w-full max-w-7xl max-h-[95vh] flex flex-col border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="flex justify-between items-center sticky top-0 bg-background pb-3 border-b z-10 px-4 pt-4 rounded-t-lg">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h2 className="text-xl font-bold">{client.name}</h2>
            {pendingChanges.hasPendingChanges && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                Unsaved changes
              </span>
            )}
          </div>
          <Button
            onClick={handleArchive}
            variant="destructive"
            size="sm"
            className="gap-2"
          >
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        </div>
        
        {/* Scrollable content */}
        <div className="overflow-y-auto p-4 flex-1">
          <div className="space-y-4">
            {/* Top row - 3 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="space-y-3">
                <ContactInformationSection client={client} />
                <ContactStatusSection client={client} pendingChanges={pendingChanges} />
              </div>
              <LastContactSection client={client} pendingChanges={pendingChanges} />
              <ImportantDatesSection client={client} pendingChanges={pendingChanges} />
            </div>

            {/* Bottom row - 2 columns for todos and notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <TodoSection clientId={clientId} pendingChanges={pendingChanges} />
              <NotesSection clientId={clientId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

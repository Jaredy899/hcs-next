import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Save, X } from "lucide-react";

interface ContactInformationSectionProps {
  client: {
    _id: Id<"clients">;
    name?: string;
    phoneNumber?: string;
    insurance?: string;
    clientId?: string;
  };
}

export function ContactInformationSection({ client }: ContactInformationSectionProps) {
  const updateContact = useMutation(api.clients.updateContact);
  
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editedContact, setEditedContact] = useState({
    name: "",
    phoneNumber: "",
    insurance: "",
    clientId: ""
  });

  // Sync local state with client changes
  useEffect(() => {
    if (client) {
      setEditedContact({
        name: client.name || "",
        phoneNumber: client.phoneNumber || "",
        insurance: client.insurance || "",
        clientId: client.clientId || ""
      });
    }
  }, [client]);

  const handleSaveContact = async () => {
    try {
      await Promise.all([
        updateContact({ id: client._id, field: "name", value: editedContact.name }),
        updateContact({ id: client._id, field: "phoneNumber", value: editedContact.phoneNumber }),
        updateContact({ id: client._id, field: "insurance", value: editedContact.insurance }),
        updateContact({ id: client._id, field: "clientId", value: editedContact.clientId })
      ]);
      setIsEditingContact(false);
      toast.success("Contact information updated");
    } catch (error) {
      toast.error("Failed to update contact information");
    }
  };

  const handleCancelEdit = () => {
    setIsEditingContact(false);
    if (client) {
      setEditedContact({
        name: client.name || "",
        phoneNumber: client.phoneNumber || "",
        insurance: client.insurance || "",
        clientId: client.clientId || ""
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
        <CardTitle className="text-sm font-semibold">Contact Information</CardTitle>
        {!isEditingContact ? (
          <Button
            onClick={() => setIsEditingContact(true)}
            variant="outline"
            size="sm"
            className="gap-1 h-6 px-2 text-xs"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button
              onClick={handleSaveContact}
              size="sm"
              className="gap-1 h-6 px-2 text-xs"
            >
              <Save className="h-3 w-3" />
              Save
            </Button>
            <Button
              onClick={handleCancelEdit}
              variant="outline"
              size="sm"
              className="gap-1 h-6 px-2 text-xs"
            >
              <X className="h-3 w-3" />
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3">
        {isEditingContact ? (
          <>
            <div className="space-y-1">
              <Label htmlFor="edit-name" className="text-xs">Name</Label>
              <Input
                id="edit-name"
                type="text"
                value={editedContact.name}
                onChange={(e) => setEditedContact(prev => ({ ...prev, name: e.target.value }))}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-phone" className="text-xs">Phone Number</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={editedContact.phoneNumber}
                onChange={(e) => setEditedContact(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-insurance" className="text-xs">Insurance</Label>
              <Input
                id="edit-insurance"
                type="text"
                value={editedContact.insurance}
                onChange={(e) => setEditedContact(prev => ({ ...prev, insurance: e.target.value }))}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-client-id" className="text-xs">Client ID</Label>
              <Input
                id="edit-client-id"
                type="text"
                value={editedContact.clientId}
                onChange={(e) => setEditedContact(prev => ({ ...prev, clientId: e.target.value }))}
                className="h-7 text-xs"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Phone</p>
              <p className="text-sm text-foreground">{client.phoneNumber || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Insurance</p>
              <p className="text-sm text-foreground">{client.insurance || "Not provided"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Client ID</p>
              <p className="text-sm text-foreground">{client.clientId || "Not provided"}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 
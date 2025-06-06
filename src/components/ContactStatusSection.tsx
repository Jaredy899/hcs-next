import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ContactStatusSectionProps {
  client: {
    _id: Id<"clients">;
    firstContactCompleted?: boolean;
    secondContactCompleted?: boolean;
  };
  pendingChanges: {
    addContactChange: (clientId: Id<"clients">, field: "firstContactCompleted" | "secondContactCompleted", value: boolean) => void;
    getContactState: (clientId: Id<"clients">, field: "firstContactCompleted" | "secondContactCompleted", originalValue: boolean) => boolean;
  };
}

export function ContactStatusSection({ client, pendingChanges }: ContactStatusSectionProps) {
  const handleToggleContact = (field: "firstContactCompleted" | "secondContactCompleted", currentValue: boolean) => {
    const newValue = !currentValue;
    pendingChanges.addContactChange(client._id, field, newValue);
  };

  const firstContactState = pendingChanges.getContactState(client._id, "firstContactCompleted", client.firstContactCompleted || false);
  const secondContactState = pendingChanges.getContactState(client._id, "secondContactCompleted", client.secondContactCompleted || false);

  return (
    <Card>
      <CardHeader className="px-3 pt-3 pb-0">
        <CardTitle className="text-sm font-semibold">Contact Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-3 py-9">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="first-contact"
            checked={firstContactState}
            onCheckedChange={() => handleToggleContact("firstContactCompleted", firstContactState)}
          />
          <Label htmlFor="first-contact" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            First Contact
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="second-contact"
            checked={secondContactState}
            onCheckedChange={() => handleToggleContact("secondContactCompleted", secondContactState)}
          />
          <Label htmlFor="second-contact" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Second Contact
          </Label>
        </div>
      </CardContent>
    </Card>
  );
} 
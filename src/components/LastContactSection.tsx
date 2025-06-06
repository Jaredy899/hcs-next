import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { getTimeBasedColor, getUpcomingDateColor } from "@/lib/dateColors";

interface LastContactSectionProps {
  client: {
    _id: Id<"clients">;
    lastContactDate?: number;
    lastFaceToFaceDate?: number;
  };
  pendingChanges: {
    addDateChange: (clientId: Id<"clients">, field: "lastContactDate" | "lastFaceToFaceDate", value: number) => void;
    getDateState: (clientId: Id<"clients">, field: "lastContactDate" | "lastFaceToFaceDate", originalValue: number | undefined) => number | undefined;
  };
}

export function LastContactSection({ client, pendingChanges }: LastContactSectionProps) {
  const handleSetToday = (field: "lastContactDate" | "lastFaceToFaceDate") => {
    const today = new Date();
    pendingChanges.addDateChange(client._id, field, today.getTime());
  };

  const handleDatePickerChange = (field: "lastContactDate" | "lastFaceToFaceDate", date: Date | undefined) => {
    if (date) {
      pendingChanges.addDateChange(client._id, field, date.getTime());
    }
  };

  const lastContactValue = pendingChanges.getDateState(client._id, "lastContactDate", client.lastContactDate);
  const lastFaceToFaceValue = pendingChanges.getDateState(client._id, "lastFaceToFaceDate", client.lastFaceToFaceDate);

  return (
    <Card>
      <CardHeader className="px-4 pt-3 pb-2">
        <CardTitle className="text-sm font-semibold">Contact Dates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-3">
        {/* Last Contact Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Contact</span>
            <Button
              onClick={() => handleSetToday("lastContactDate")}
              size="sm"
              className="h-6 px-2 gap-1 text-xs"
            >
              <Calendar className="h-3 w-3" />
              Today
            </Button>
          </div>
          
          {/* Date Picker */}
          <DatePicker
            date={lastContactValue ? new Date(lastContactValue) : undefined}
            onDateChange={(date) => handleDatePickerChange("lastContactDate", date)}
            placeholder="Select date"
            className="h-7 text-xs"
          />

          <p className="text-sm text-muted-foreground">
            {lastContactValue
              ? <span className={getTimeBasedColor(lastContactValue, 30, "text-green-600")}>{new Date(lastContactValue).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              : "No contact recorded"}
          </p>
        </div>

        {/* Last Face to Face Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Face to Face</span>
            <Button
              onClick={() => handleSetToday("lastFaceToFaceDate")}
              size="sm"
              className="h-6 px-2 gap-1 text-xs"
            >
              <Calendar className="h-3 w-3" />
              Today
            </Button>
          </div>
          
          {/* Date Picker */}
          <DatePicker
            date={lastFaceToFaceValue ? new Date(lastFaceToFaceValue) : undefined}
            onDateChange={(date) => handleDatePickerChange("lastFaceToFaceDate", date)}
            placeholder="Select date"
            className="h-7 text-xs"
          />

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {lastFaceToFaceValue
                ? <span className={getTimeBasedColor(lastFaceToFaceValue, 90, "text-green-600")}>{new Date(lastFaceToFaceValue).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                : "No face to face recorded"}
            </p>
            {lastFaceToFaceValue && (
              <p className="text-sm font-medium">
                <span className="text-muted-foreground">Next due: </span>
                <span className={getUpcomingDateColor(new Date(lastFaceToFaceValue + (90 * 24 * 60 * 60 * 1000)), 15, "text-indigo-600")}>
                  {new Date(lastFaceToFaceValue + (90 * 24 * 60 * 60 * 1000)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
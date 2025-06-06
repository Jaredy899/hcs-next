import { useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { getQuarterlyReviewDates } from "./utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface QuarterlyReviewsSectionProps {
  client: {
    _id: Id<"clients">;
    nextAnnualAssessment: number;
    qr1Date?: number | null;
    qr2Date?: number | null;
    qr3Date?: number | null;
    qr4Date?: number | null;
    qr1Completed?: boolean;
    qr2Completed?: boolean;
    qr3Completed?: boolean;
    qr4Completed?: boolean;
  };
  pendingChanges: {
    addContactChange: (clientId: Id<"clients">, field: "qr1Completed" | "qr2Completed" | "qr3Completed" | "qr4Completed", value: boolean) => void;
    getContactState: (clientId: Id<"clients">, field: "qr1Completed" | "qr2Completed" | "qr3Completed" | "qr4Completed", originalValue: boolean) => boolean;
    addDateChange: (clientId: Id<"clients">, field: "nextAnnualAssessment" | "qr1Date" | "qr2Date" | "qr3Date" | "qr4Date", value: number) => void;
    getDateState: (clientId: Id<"clients">, field: "nextAnnualAssessment" | "qr1Date" | "qr2Date" | "qr3Date" | "qr4Date", originalValue: number | undefined) => number | undefined;
  };
}

export function QuarterlyReviewsSection({ client, pendingChanges }: QuarterlyReviewsSectionProps) {
  // Add local state for quarterly review dates (only month for each quarter)
  const [qrMonths, setQrMonths] = useState(() =>
    [0, 1, 2, 3].map((i) => {
      const qrField = `qr${i + 1}Date` as "qr1Date" | "qr2Date" | "qr3Date" | "qr4Date";
      const pendingValue = pendingChanges.getDateState(client._id, qrField, client[qrField] || undefined);
      const date = pendingValue !== undefined && pendingValue !== null
        ? new Date(pendingValue)
        : getQuarterlyReviewDates(client?.nextAnnualAssessment || Date.now())[i].date;
      return date.getMonth() + 1;
    })
  );

  // Sync local state with client changes and pending changes
  useEffect(() => {
    if (client) {
      setQrMonths(
        [0, 1, 2, 3].map((i) => {
          const qrField = `qr${i + 1}Date` as "qr1Date" | "qr2Date" | "qr3Date" | "qr4Date";
          const pendingValue = pendingChanges.getDateState(client._id, qrField, client[qrField] || undefined);
          const date = pendingValue !== undefined && pendingValue !== null
            ? new Date(pendingValue)
            : getQuarterlyReviewDates(client?.nextAnnualAssessment || Date.now())[i].date;
          return date.getMonth() + 1;
        })
      );
    }
  }, [client, pendingChanges]);

  const handleQuarterlyReviewToggle = async (index: number, checked: boolean) => {
    const qrField = `qr${index + 1}Completed` as "qr1Completed" | "qr2Completed" | "qr3Completed" | "qr4Completed";
    
    // If this is Q4 being completed, reset all quarterly reviews
    if (index === 3 && checked) {
      pendingChanges.addContactChange(client._id, "qr1Completed", false);
      pendingChanges.addContactChange(client._id, "qr2Completed", false);
      pendingChanges.addContactChange(client._id, "qr3Completed", false);
      pendingChanges.addContactChange(client._id, "qr4Completed", false);
    } else {
      pendingChanges.addContactChange(client._id, qrField, checked);
    }
  };

  const handleQrDateChange = (index: number, month: number) => {
    const qrDateField = `qr${index + 1}Date` as "qr1Date" | "qr2Date" | "qr3Date" | "qr4Date";
    const year = new Date().getFullYear();
    
    // Set day based on quarter type:
    // Q1, Q2, Q3: 1st of the month
    // Q4: Last day of the month
    let day: number;
    if (index === 3) { // Q4
      // Get the last day of the month
      day = new Date(year, month, 0).getDate();
    } else { // Q1, Q2, Q3
      day = 1;
    }
    
    const newDate = new Date(year, month - 1, day);
    pendingChanges.addDateChange(client._id, qrDateField, newDate.getTime());
    
    // Update local state
    setQrMonths((prev) =>
      prev.map((m, i) => i === index ? month : m)
    );
  };

  const handleResetToCalculatedDates = () => {
    // Get the current annual assessment date (including any pending changes)
    const currentAnnualAssessment = pendingChanges.getDateState(client._id, "nextAnnualAssessment", client.nextAnnualAssessment) || client.nextAnnualAssessment;
    
    // Get the calculated quarterly review dates based on the current/pending annual assessment
    const qrDates = getQuarterlyReviewDates(currentAnnualAssessment);
    
    // Update each quarter's date using the pending changes system
    qrDates.forEach((qr, index) => {
      const qrDateField = `qr${index + 1}Date` as "qr1Date" | "qr2Date" | "qr3Date" | "qr4Date";
      pendingChanges.addDateChange(client._id, qrDateField, qr.date.getTime());
    });
    
    // Update local state to reflect the calculated dates
    setQrMonths(qrDates.map(qr => qr.date.getMonth() + 1));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium">Quarterly Reviews</p>
        <Button
          onClick={handleResetToCalculatedDates}
          variant="ghost"
          size="sm"
          className="text-xs h-6 px-2"
        >
          Reset to Calculated Dates
        </Button>
      </div>
      <div className="space-y-2 bg-muted/50 rounded-md p-3">
        {(() => {
          // Use the pending annual assessment date for calculating display dates
          const currentAnnualAssessment = pendingChanges.getDateState(client._id, "nextAnnualAssessment", client.nextAnnualAssessment) || client.nextAnnualAssessment;
          return getQuarterlyReviewDates(currentAnnualAssessment);
        })().map((qr, index) => {
          const qrField = `qr${index + 1}Completed` as "qr1Completed" | "qr2Completed" | "qr3Completed" | "qr4Completed";
          const month = qrMonths[index];

          const displayCompleted = pendingChanges.getContactState(client._id, qrField, client[qrField] || false);

          return (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-1">
              <span className="text-sm font-medium text-muted-foreground w-20">{qr.label}:</span>
              <div className="flex items-center gap-1 flex-1">
                <Select
                  value={month.toString()}
                  onValueChange={(value) => {
                    const newMonth = parseInt(value);
                    handleQrDateChange(index, newMonth);
                  }}
                >
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Jan</SelectItem>
                    <SelectItem value="2">Feb</SelectItem>
                    <SelectItem value="3">Mar</SelectItem>
                    <SelectItem value="4">Apr</SelectItem>
                    <SelectItem value="5">May</SelectItem>
                    <SelectItem value="6">Jun</SelectItem>
                    <SelectItem value="7">Jul</SelectItem>
                    <SelectItem value="8">Aug</SelectItem>
                    <SelectItem value="9">Sep</SelectItem>
                    <SelectItem value="10">Oct</SelectItem>
                    <SelectItem value="11">Nov</SelectItem>
                    <SelectItem value="12">Dec</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground w-12 text-center">
                  {index === 3 ? "Last" : "1st"}
                </span>
                <div className="flex items-center space-x-1 ml-1">
                  <Checkbox
                    id={`qr-${index}`}
                    checked={displayCompleted}
                    onCheckedChange={(checked) => handleQuarterlyReviewToggle(index, checked as boolean)}
                  />
                  <Label htmlFor={`qr-${index}`} className="text-sm">Done</Label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 
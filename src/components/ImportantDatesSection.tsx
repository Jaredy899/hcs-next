import { useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { QuarterlyReviewsSection } from "./QuarterlyReviewsSection";
import { getQuarterlyReviewDates } from "./utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ImportantDatesSectionProps {
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

export function ImportantDatesSection({ client, pendingChanges }: ImportantDatesSectionProps) {
  const annualAssessmentValue = pendingChanges.getDateState(client._id, "nextAnnualAssessment", client.nextAnnualAssessment) || client.nextAnnualAssessment;

  const [annualMonth, setAnnualMonth] = useState(() => {
    return new Date(annualAssessmentValue).getMonth() + 1;
  });

  // Update local state when the pending value changes
  useEffect(() => {
    const currentValue = annualAssessmentValue;
    if (currentValue) {
      const date = new Date(currentValue);
      setAnnualMonth(date.getMonth() + 1);
    }
  }, [annualAssessmentValue]);

  const handleAnnualDateChange = (month: number) => {
    // Always set to the 1st of the month
    const annualDate = new Date(new Date().getFullYear(), month - 1, 1);
    pendingChanges.addDateChange(client._id, "nextAnnualAssessment", annualDate.getTime());
    setAnnualMonth(month);
    
    // Automatically recalculate and update quarterly review dates
    const qrDates = getQuarterlyReviewDates(annualDate.getTime());
    qrDates.forEach((qr, index) => {
      const qrDateField = `qr${index + 1}Date` as "qr1Date" | "qr2Date" | "qr3Date" | "qr4Date";
      pendingChanges.addDateChange(client._id, qrDateField, qr.date.getTime());
    });
  };

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return (
    <Card>
      <CardHeader className="px-4 pt-3 pb-2">
        <CardTitle className="text-sm font-semibold">Important Dates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-3">
        <div className="space-y-2">
          <Label className="text-sm">Annual Assessment Date</Label>
          <Select
            value={annualMonth.toString()}
            onValueChange={(value) => {
              const newMonth = parseInt(value);
              handleAnnualDateChange(newMonth);
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={month} value={(index + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <QuarterlyReviewsSection client={client} pendingChanges={pendingChanges} />
      </CardContent>
    </Card>
  );
} 
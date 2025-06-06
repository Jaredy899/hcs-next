import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { ImportClientsForm } from "./ImportClientsForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

function getQuarterlyReviewDates(annualAssessmentDate: number) {
  const date = new Date(annualAssessmentDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Calculate the dates for each quarter
  // Q1: 3 months after annual assessment
  // Q2: 6 months after annual assessment
  // Q3: 9 months after annual assessment
  // Q4: Last day of the month before annual assessment
  const q1 = new Date(year, month + 3, day);
  const q2 = new Date(year, month + 6, day);
  const q3 = new Date(year, month + 9, day);
  
  // For Q4, we need to handle the end of the month before the annual assessment
  const q4Month = month === 0 ? 11 : month - 1;
  const q4Year = month === 0 ? year - 1 : year;
  const lastDay = new Date(q4Year, q4Month + 1, 0).getDate(); // Get last day of the month
  const q4 = new Date(q4Year, q4Month, lastDay);

  return [
    { label: "1st Quarter", date: q1 },
    { label: "2nd Quarter", date: q2 },
    { label: "3rd Quarter", date: q3 },
    { label: "4th Quarter", date: q4 }
  ];
}

export function AddClientForm({ onClose }: { onClose: () => void }) {
  const addClient = useMutation(api.clients.add);
  const [showImportForm, setShowImportForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    insurance: "",
    clientId: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const qrDates = getQuarterlyReviewDates(firstOfMonth.getTime());
    
    await addClient({
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      insurance: formData.insurance,
      clientId: formData.clientId,
      nextQuarterlyReview: today.getTime(),
      nextAnnualAssessment: firstOfMonth.getTime()
    });

    setFormData({
      name: "",
      phoneNumber: "",
      insurance: "",
      clientId: ""
    });
    onClose();
  };

  if (showImportForm) {
    return <ImportClientsForm onClose={() => setShowImportForm(false)} />;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Add New Consumer</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowImportForm(true)}
                variant="secondary"
              >
                Import CSV
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                type="tel"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance">Insurance</Label>
              <Input
                type="text"
                id="insurance"
                value={formData.insurance}
                onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Consumer ID</Label>
              <Input
                type="text"
                id="clientId"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!formData.name || !formData.phoneNumber}
            >
              Add Consumer
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

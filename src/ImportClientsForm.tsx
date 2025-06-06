import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// Proper CSV parser that handles quoted fields with commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  return result;
}

export function ImportClientsForm({ onClose }: { onClose: () => void }) {
  const bulkImport = useMutation(api.clients.bulkImport);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }

      // Parse header to understand column structure
      const headerFields = parseCSVLine(lines[0]);
      console.log('CSV Headers:', headerFields);
      
      // Skip header row and parse data
      const clients = [];
      const errors: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        try {
          const fields = parseCSVLine(lines[i]);
          
          // Map fields based on your CSV structure:
          // Id, First Name, Last Name, Preferred Name, Client/Record ID, Cell Phone, Plan Program, Plan End Date, Primary Provider, Authorization ID
          const [
            id,
            firstName,
            lastName,
            preferredName,
            clientRecordId,
            cellPhone,
            planProgram,
            planEndDate,
            _primaryProvider,
            authorizationId
          ] = fields;

          // Skip rows with missing essential data
          if (!firstName || !lastName) {
            errors.push(`Row ${i + 1}: Missing first name or last name`);
            continue;
          }

          const client = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            preferredName: preferredName?.trim() || undefined,
            clientId: clientRecordId?.trim() || id?.trim(),
            phoneNumber: cellPhone?.trim() || "No phone provided",
            insurance: authorizationId?.trim() || "No insurance provided",
            annualAssessmentDate: planEndDate?.trim() || "12/31/2025",
            planProgram: planProgram?.trim() || undefined,
          };

          clients.push(client);
        } catch (rowError) {
          errors.push(`Row ${i + 1}: ${rowError instanceof Error ? rowError.message : 'Parse error'}`);
        }
      }

      if (clients.length === 0) {
        throw new Error('No valid client records found in CSV');
      }

      console.log(`Parsed ${clients.length} clients, ${errors.length} errors`);
      if (errors.length > 0) {
        console.warn('Parsing errors:', errors);
      }

      await bulkImport({ 
        clients
      });
      
      const successMessage = `Successfully imported clients with WCCSS prioritization`;
      const warningMessage = errors.length > 0 ? ` (${errors.length} rows had errors and were skipped)` : '';
      setSuccess(successMessage + warningMessage);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import clients');
      setSuccess(null);
    }
  };

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
            <h2 className="text-xl font-semibold">Import Clients from CSV</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="mt-4 flex text-sm text-muted-foreground">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-background font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                  >
                    <span>Upload a CSV file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".csv"
                      className="sr-only"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  CSV file with columns: Id, First Name, Last Name, Preferred Name, Client/Record ID, Cell Phone, Plan End Date, Insurance/Authorization ID
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/15 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-destructive">Error</h3>
                    <div className="mt-2 text-sm text-destructive/80">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-500/15 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Success</h3>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">{success}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
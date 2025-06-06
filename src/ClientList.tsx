import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";
import { getTimeBasedColor } from "@/lib/dateColors";

function getUpcomingDates(client: any) {
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12
  
  // Check if annual assessment is due this month
  const annualDate = new Date(client.nextAnnualAssessment);
  const annualMonth = annualDate.getMonth() + 1; // 1-12
  const isAnnualDue = annualMonth === currentMonth;
  
  // Simple logic: show red if annual assessment is next month
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const isAnnualDueNextMonth = annualMonth === nextMonth;

  // Get quarterly review dates
  const qrDates = getQuarterlyReviewDates(client.nextAnnualAssessment);
  
  // Find the next QR date based on completed QRs
  let nextQRIndex = 0;
  if (client.qr1Completed) nextQRIndex = 1;
  if (client.qr2Completed) nextQRIndex = 2;
  if (client.qr3Completed) nextQRIndex = 3;
  if (client.qr4Completed) nextQRIndex = 0; // Reset to Q1 if all are completed
  
  // Use custom date if it exists, otherwise use calculated date
  let nextQRDate;
  const customDate = client[`qr${nextQRIndex + 1}Date`];
  if (customDate && customDate !== null) {
    nextQRDate = new Date(customDate);
  } else {
    nextQRDate = qrDates[nextQRIndex];
  }

  // Only show red if the QR is due in the current month
  const isQRDue = nextQRDate && nextQRDate.getMonth() + 1 === currentMonth;

  // If it's Q4, we need to show both QR and Annual Assessment
  const isQ4 = qrDates.some(qr => {
    const qrMonth = qr.getMonth() + 1;
    return qrMonth === currentMonth && annualMonth === currentMonth + 1;
  });

  return {
    isAnnualDue,
    isAnnualDueNextMonth,
    isQRDue,
    isQ4,
    annualDate: annualDate,
    qrDates: qrDates,
    nextQRDate: nextQRDate,
    nextQRIndex: nextQRIndex
  };
}

function getQuarterlyReviewDates(annualAssessmentDate: number) {
  const date = new Date(annualAssessmentDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Calculate the dates for each quarter (3 months after annual assessment)
  const q1 = new Date(year, (month + 3) % 12, date.getDate());
  const q2 = new Date(year, (month + 6) % 12, date.getDate());
  const q3 = new Date(year, (month + 9) % 12, date.getDate());
  
  // For Q4, we need to handle the end of the month before the annual assessment
  const q4Month = month === 0 ? 11 : month - 1;
  const q4Year = month === 0 ? year - 1 : year;
  const lastDay = new Date(q4Year, q4Month + 1, 0).getDate(); // Get last day of the month
  const q4 = new Date(q4Year, q4Month, lastDay);

  // Adjust years for quarters that cross into next year
  if (month + 3 >= 12) q1.setFullYear(year + 1);
  if (month + 6 >= 12) q2.setFullYear(year + 1);
  if (month + 9 >= 12) q3.setFullYear(year + 1);

  return [q1, q2, q3, q4];
}

export function ClientList({
  selectedClientId,
  onSelectClient,
  onCloseClient,
}: {
  selectedClientId: Id<"clients"> | null;
  onSelectClient: (id: Id<"clients">) => void;
  onCloseClient: () => void;
}) {
  const clients = useQuery(api.clients.list) || [];
  const todoCounts = useQuery(api.todos.getClientTodoCounts) || {};
  const updateClient = useMutation(api.clients.updateContact);
  const [sortBy, setSortBy] = useState<'first' | 'last'>('last');
  const [searchTerm, setSearchTerm] = useState('');
  
  // New sort state
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Clear search when client is deselected
  useEffect(() => {
    if (!selectedClientId) {
      setSearchTerm('');
      // Focus the search input when modal closes
      searchInputRef.current?.focus();
    }
  }, [selectedClientId]);

  const handleColumnSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort clients based on selected column and direction
  const sortedClients = [...clients].sort((a, b) => {
    let comparison = 0;
    
    switch (sortColumn) {
      case 'name':
        const aName = a.name.split(' ');
        const bName = b.name.split(' ');
        
        if (sortBy === 'first') {
          comparison = aName[0].localeCompare(bName[0]);
        } else {
          const aLast = aName[aName.length - 1];
          const bLast = bName[bName.length - 1];
          comparison = aLast.localeCompare(bLast);
        }
        break;
        
      case 'annualAssessment':
        const aAnnual = a.nextAnnualAssessment || 0;
        const bAnnual = b.nextAnnualAssessment || 0;
        comparison = aAnnual - bAnnual;
        break;
        
      case 'nextQR':
        const aUpcoming = getUpcomingDates(a);
        const bUpcoming = getUpcomingDates(b);
        const aQRDate = aUpcoming.nextQRDate ? aUpcoming.nextQRDate.getTime() : 0;
        const bQRDate = bUpcoming.nextQRDate ? bUpcoming.nextQRDate.getTime() : 0;
        comparison = aQRDate - bQRDate;
        break;
        
      case 'lastContact':
        const aContact = a.lastContactDate || 0;
        const bContact = b.lastContactDate || 0;
        comparison = aContact - bContact;
        break;
        
      case 'lastF2F':
        const aF2F = a.lastFaceToFaceDate || 0;
        const bF2F = b.lastFaceToFaceDate || 0;
        comparison = aF2F - bF2F;
        break;
        
      case 'nextF2F':
        const aNextF2F = a.lastFaceToFaceDate ? (a.lastFaceToFaceDate + (90 * 24 * 60 * 60 * 1000)) : 0;
        const bNextF2F = b.lastFaceToFaceDate ? (b.lastFaceToFaceDate + (90 * 24 * 60 * 60 * 1000)) : 0;
        comparison = aNextF2F - bNextF2F;
        break;
        
      default:
        comparison = 0;
    }
    
    // Apply sort direction
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Filter clients based on search term
  const filteredClients = sortedClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredClients.length === 1) {
      onSelectClient(filteredClients[0]._id);
    } else if (e.key === 'Escape') {
      setSearchTerm('');
      if (selectedClientId) {
        onCloseClient();
      }
    }
  };

  const handleMarkComplete = async (clientId: Id<"clients">, type: 'qr' | 'annual') => {
    const today = new Date().getTime();
    await updateClient({
      id: clientId,
      field: type === 'qr' ? 'lastQRCompleted' : 'lastAnnualCompleted',
      value: today,
    });
  };
  
  // Helper function to render sort indicators
  const renderSortIndicator = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
              Search Clients
            </label>
            <Input
              id="search"
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by name... (Press Enter when one result, Esc to clear)"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Sort by:</label>
            <Select value={sortBy} onValueChange={(value: 'first' | 'last') => setSortBy(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first">First Name</SelectItem>
                <SelectItem value="last">Last Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Desktop table view */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50"
                  onClick={() => handleColumnSort('name')}
                >
                  Consumer{renderSortIndicator('name')}
                </TableHead>
                {/* <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50"
                  onClick={() => handleColumnSort('annualAssessment')}
                >
                  Annual Assessment{renderSortIndicator('annualAssessment')}
                </TableHead> */}
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50"
                  onClick={() => handleColumnSort('nextQR')}
                >
                  Next QR{renderSortIndicator('nextQR')}
                </TableHead>
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50"
                  onClick={() => handleColumnSort('lastContact')}
                >
                  Last Contact{renderSortIndicator('lastContact')}
                </TableHead>
                <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50"
                  onClick={() => handleColumnSort('lastF2F')}
                >
                  Last Face to Face{renderSortIndicator('lastF2F')}
                </TableHead>
                {/* <TableHead 
                  className="text-center cursor-pointer hover:bg-muted/50"
                  onClick={() => handleColumnSort('nextF2F')}
                >
                  Next Face to Face{renderSortIndicator('nextF2F')}
                </TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => {
                const upcomingDates = getUpcomingDates(client);
                
                return (
                  <TableRow
                    key={client._id}
                    className={`cursor-pointer transition-colors ${
                      client._id === selectedClientId 
                        ? "bg-muted/50" 
                        : "hover:bg-muted/25"
                    }`}
                    onClick={() => onSelectClient(client._id)}
                  >
                    <TableCell className="text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <h3 className="text-sm font-medium">{client.name}</h3>
                          {todoCounts[client._id]?.incomplete > 0 && (
                            <div title={`${todoCounts[client._id].incomplete} incomplete todo${todoCounts[client._id].incomplete !== 1 ? 's' : ''}`}>
                              <ClipboardList className="w-3 h-3 text-blue-500" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{client.phoneNumber}</p>
                        <div className="flex gap-1 mt-1 justify-center">
                          <Badge 
                            variant={client.firstContactCompleted ? "secondary" : "destructive"} 
                            className={`text-[10px] px-1.5 py-0.5 h-4 ${client.firstContactCompleted ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}
                          >
                            {client.firstContactCompleted ? "1st Contact ✓" : "1st Contact ✗"}
                          </Badge>
                          <Badge 
                            variant={client.secondContactCompleted ? "secondary" : "destructive"} 
                            className={`text-[10px] px-1.5 py-0.5 h-4 ${client.secondContactCompleted ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}
                          >
                            {client.secondContactCompleted ? "2nd Contact ✓" : "2nd Contact ✗"}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    {/* <TableCell className="text-center text-xs text-muted-foreground">
                      {client.nextAnnualAssessment
                        ? (
                          <span className={`${upcomingDates.isAnnualDueNextMonth ? "text-red-600 font-bold" : "text-purple-600 font-medium"}`}>
                            {new Date(client.nextAnnualAssessment).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: undefined
                            })}
                          </span>
                        )
                        : <span className="text-gray-400">Not set</span>}
                    </TableCell> */}
                    <TableCell className="text-center text-xs">
                      {upcomingDates.nextQRDate ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className={`${upcomingDates.isQRDue ? "text-red-600 font-bold" : "text-blue-600 font-medium"}`}>
                            {upcomingDates.nextQRDate.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-blue-400 text-xs">
                            (Q{upcomingDates.nextQRIndex + 1})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {client.lastContactDate
                        ? <span className={getTimeBasedColor(client.lastContactDate, 30, "text-green-600")}>{new Date(client.lastContactDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        : <span className="text-gray-400">No contact recorded</span>}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {client.lastFaceToFaceDate
                        ? <span className={getTimeBasedColor(client.lastFaceToFaceDate, 90, "text-green-600")}>{new Date(client.lastFaceToFaceDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        : <span className="text-gray-400">No face to face recorded</span>}
                    </TableCell>
                    {/* <TableCell className="text-center text-xs">
                      {client.lastFaceToFaceDate
                        ? (() => {
                            const nextFaceToFaceDate = new Date(client.lastFaceToFaceDate + (90 * 24 * 60 * 60 * 1000));
                            const today = new Date();
                            const daysUntilNext = Math.ceil((nextFaceToFaceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            const isDueSoon = daysUntilNext <= 15;
                            
                            return (
                              <span className={getUpcomingDateColor(nextFaceToFaceDate, 15, "text-indigo-600")}>
                                {nextFaceToFaceDate.toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            );
                          })()
                        : <span className="text-gray-400">Not applicable</span>}
                    </TableCell> */}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden space-y-4">
          {filteredClients.map((client) => {
            const upcomingDates = getUpcomingDates(client);
            
            return (
              <Card
                key={client._id}
                className={`cursor-pointer transition-colors ${
                  client._id === selectedClientId ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => onSelectClient(client._id)}
              >
                <CardContent className="p-4">
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="text-base font-medium">{client.name}</h3>
                      {todoCounts[client._id]?.incomplete > 0 && (
                        <div title={`${todoCounts[client._id].incomplete} incomplete todo${todoCounts[client._id].incomplete !== 1 ? 's' : ''}`}>
                          <ClipboardList className="w-3 h-3 text-blue-500" />
                        </div>
                      )}
                    </div>
                    <a 
                      href={`tel:${client.phoneNumber}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-primary hover:underline"
                    >
                      {client.phoneNumber}
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {clients.length === 0 && (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              No consumers yet
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

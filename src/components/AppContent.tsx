"use client";

import { SignInButton, UserButton, useClerk } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ClientList } from "~/ClientList";
import { useState, useEffect } from "react";
import { ClientDetails } from "~/ClientDetails";
import { AddClientForm } from "~/AddClientForm";
import { type Id } from "../../convex/_generated/dataModel";
import { ThemeSwitcher } from "~/ThemeSwitcher";
import { Button } from "~/components/ui/button";
import { useGlobalHotkeys } from "~/hooks/useGlobalHotkeys";
import { HotkeysButton, HotkeysHelp } from "~/components/HotkeysHelp";
import { StickyNotes } from "~/components/StickyNotes";

export function AppContent() {
  const [selectedClientId, setSelectedClientId] = useState<Id<"clients"> | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showStickyNotes, setShowStickyNotes] = useState(false);
  const { signOut } = useClerk();
  
  const createStickyNote = useMutation(api.stickyNotes.create);
  const stickyNotes = useQuery(api.stickyNotes.list) || [];

  const handleCreateNote = async () => {
    // Position new note near the last note, or center if no notes exist
    let x, y;
    if (stickyNotes.length > 0) {
      const lastNote = stickyNotes[0]; // Most recent note
      if (lastNote) {
        x = lastNote.position.x + 100;
        y = lastNote.position.y + 100;
        // Keep within bounds
        if (x > window.innerWidth - 300) x = lastNote.position.x - 100;
        if (y > window.innerHeight - 200) y = lastNote.position.y - 100;
      } else {
        x = Math.max(50, (window.innerWidth - 300) / 2);
        y = Math.max(100, (window.innerHeight - 200) / 2);
      }
    } else {
      x = Math.max(50, (window.innerWidth - 300) / 2);
      y = Math.max(100, (window.innerHeight - 200) / 2);
    }
    
    await createStickyNote({
      text: "",
      position: { x, y },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b">
        <div className="flex items-center gap-2">
          <img 
            src="https://highlandscsb.org/wp-content/uploads/2012/10/favicon.png" 
            alt="HCS Logo" 
            className="w-6 h-6"
          />
          <h2 className="text-lg sm:text-xl font-semibold">HCS Case Management System</h2>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <HotkeysButton onClick={() => setShowHelp(true)} />
          <ThemeSwitcher />
          <Authenticated>
            <Button
              onClick={async () => {
                if (!showStickyNotes) {
                  setShowStickyNotes(true);
                  // If no notes exist, create one automatically
                  if (stickyNotes.length === 0) {
                    await handleCreateNote();
                  }
                } else {
                  setShowStickyNotes(false);
                }
              }}
              variant={showStickyNotes ? "default" : "outline"}
              size="sm"
              className="w-full sm:w-auto"
            >
              📝 Notes
            </Button>
            <Button
              onClick={() => setShowAddClient(true)}
              className="w-full sm:w-auto"
            >
              Add Consumer
            </Button>
            <Button
              onClick={() => signOut()}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              Sign Out
            </Button>
            <UserButton />
          </Authenticated>
          <Unauthenticated>
            <SignInButton mode="modal">
              <Button>
                Sign In
              </Button>
            </SignInButton>
          </Unauthenticated>
        </div>
      </header>
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <Content
            selectedClientId={selectedClientId}
            setSelectedClientId={setSelectedClientId}
            showAddClient={showAddClient}
            setShowAddClient={setShowAddClient}
            showHelp={showHelp}
            setShowHelp={setShowHelp}
          />
        </div>
      </main>
      <HotkeysHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <Authenticated>
        <StickyNotes 
          showStickyNotes={showStickyNotes} 
          onCreateNote={handleCreateNote}
          onHideNotes={() => setShowStickyNotes(false)}
        />
      </Authenticated>
    </div>
  );
}

function Content({
  selectedClientId,
  setSelectedClientId,
  showAddClient,
  setShowAddClient,
  showHelp,
  setShowHelp,
}: {
  selectedClientId: Id<"clients"> | null;
  setSelectedClientId: (id: Id<"clients"> | null) => void;
  showAddClient: boolean;
  setShowAddClient: (show: boolean) => void;
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const createOrGetUser = useMutation(api.auth.createOrGetUser);
  const currentUser = useQuery(api.auth.getCurrentUser);
  const clients = useQuery(api.clients.list) || [];
  const [userCreated, setUserCreated] = useState(false);

  // Create or get user when authenticated - only if currentUser query has loaded and returned null
  useEffect(() => {
    if (isAuthenticated && currentUser === null && !userCreated) {
      setUserCreated(true);
      createOrGetUser().catch(console.error);
    }
  }, [isAuthenticated, currentUser, createOrGetUser, userCreated]);

  const handleCloseClient = () => {
    setSelectedClientId(null);
  };

  // Global hotkeys implementation
  useGlobalHotkeys({
    onFocusSearch: () => {
      // Focus search - for /
      if (!selectedClientId && !showAddClient && isAuthenticated) {
        const searchInput = document.getElementById('search') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    },
    onEscape: () => {
      if (showHelp) {
        setShowHelp(false);
      } else if (showAddClient) {
        setShowAddClient(false);
      } else if (selectedClientId) {
        handleCloseClient();
      }
    },
    onAddClient: () => {
      if (isAuthenticated && !selectedClientId && !showAddClient) {
        setShowAddClient(true);
      }
    },
    onShowHelp: () => {
      setShowHelp(true);
    },
    enabled: isAuthenticated,
  });

  // Show loading if auth is still loading or if currentUser is undefined (query is loading)
  if (isLoading || (isAuthenticated && currentUser === undefined)) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">HCS Case Management System</h1>
          <div className="mt-8">
            <SignInButton mode="modal">
              <Button size="lg">
                Sign In to Continue
              </Button>
            </SignInButton>
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        {showAddClient && (
          <AddClientForm onClose={() => setShowAddClient(false)} />
        )}

        {selectedClientId ? (
          <ClientDetails
            clientId={selectedClientId}
            onClose={handleCloseClient}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold">Your Caseload</h1>
              <p className="text-muted-foreground">
                {clients.length} consumer{clients.length !== 1 ? 's' : ''} assigned
              </p>
            </div>

            <ClientList
              selectedClientId={selectedClientId}
              onSelectClient={setSelectedClientId}
              onCloseClient={handleCloseClient}
            />
          </div>
        )}
      </Authenticated>
    </div>
  );
} 
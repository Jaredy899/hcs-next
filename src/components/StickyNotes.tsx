import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Save, X, Plus, Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface StickyNoteData {
  _id: Id<"stickyNotes">;
  text: string;
  color?: string;
  position: { x: number; y: number };
  createdAt: number;
  updatedAt: number;
}

const STICKY_NOTE_COLORS = [
  "#fef3c7", // Yellow
  "#fce7f3", // Pink
  "#e0f2fe", // Light Blue
  "#f0fdf4", // Green
  "#fef4e6", // Orange
  "#f3e8ff", // Purple
  "#f1f5f9", // Gray
];

interface StickyNotesProps {
  showStickyNotes: boolean;
  onCreateNote: () => Promise<void>;
  onHideNotes: () => void;
}

export function StickyNotes({ showStickyNotes, onCreateNote, onHideNotes }: StickyNotesProps) {
  const stickyNotes = useQuery(api.stickyNotes.list) || [];
  const updateStickyNote = useMutation(api.stickyNotes.update);
  const deleteStickyNote = useMutation(api.stickyNotes.remove);

  if (!showStickyNotes) {
    return null;
  }

  return (
    <>
      {/* Overlay to detect clicks outside notes */}
      <div 
        className="fixed inset-0 z-30"
        onClick={onHideNotes}
      />
      
      {stickyNotes.map((note: StickyNoteData) => (
        <StickyNoteCard
          key={note._id}
          note={note}
          onUpdate={updateStickyNote}
          onDelete={deleteStickyNote}
          onCreateNote={onCreateNote}
        />
      ))}
    </>
  );
}

interface StickyNoteCardProps {
  note: StickyNoteData;
  onUpdate: (args: { id: Id<"stickyNotes">; text?: string; color?: string; position?: { x: number; y: number } }) => Promise<null>;
  onDelete: (args: { id: Id<"stickyNotes"> }) => Promise<null>;
  onCreateNote: () => Promise<void>;
}

function StickyNoteCard({ note, onUpdate, onDelete, onCreateNote }: StickyNoteCardProps) {
  const [isEditing, setIsEditing] = useState(note.text === "");
  const [editText, setEditText] = useState(note.text);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow dragging even during editing, but only if clicking on non-input areas
    const target = e.target as HTMLElement;
    if (isEditing && (target.tagName === 'TEXTAREA' || target.closest('button'))) {
      return;
    }
    
    setIsDragging(true);
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    
    // Keep note within viewport bounds
    const maxX = window.innerWidth - 250;
    const maxY = window.innerHeight - 150;
    
    const clampedX = Math.max(0, Math.min(maxX, x));
    const clampedY = Math.max(0, Math.min(maxY, y));
    
    onUpdate({
      id: note._id,
      position: { x: clampedX, y: clampedY },
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Auto-save when clicking outside the note
  useEffect(() => {
    if (!isEditing) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (cardRef.current && !cardRef.current.contains(target)) {
        saveEdit();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing, editText]);

  const startEditing = () => {
    setIsEditing(true);
    setEditText(note.text);
  };

  const saveEdit = async () => {
    if (!editText.trim()) {
      // Delete empty notes
      await onDelete({ id: note._id });
      return;
    }
    await onUpdate({ id: note._id, text: editText });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditText(note.text);
  };

  const handleColorChange = async (color: string) => {
    await onUpdate({ id: note._id, color });
  };

  return (
    <Card
      ref={cardRef}
      className={`fixed w-64 shadow-lg cursor-move select-none z-40 ${
        isDragging ? "opacity-80" : ""
      }`}
      style={{
        left: note.position.x,
        top: note.position.y,
        backgroundColor: note.color || "#fef3c7",
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-1">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onCreateNote();
              }}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-white/70 hover:bg-white/90 text-gray-700 hover:text-gray-900"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 bg-white/70 hover:bg-white/90 text-gray-700 hover:text-gray-900"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Palette className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" side="bottom">
                <div className="grid grid-cols-4 gap-1">
                  {STICKY_NOTE_COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border-2 border-muted hover:border-foreground"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-1">
            {!isEditing && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing();
                }}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white/70 hover:bg-white/90 text-gray-700 hover:text-gray-900"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDelete({ id: note._id });
              }}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-white/70 hover:bg-white/90 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[80px] resize-none text-sm bg-white/90 border-muted text-gray-900"
              placeholder="Enter your note..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                }
                if (e.key === "Escape") {
                  cancelEdit();
                }
              }}
            />
            <div className="flex gap-1">
              <Button
                onClick={saveEdit}
                size="sm"
                className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button
                onClick={cancelEdit}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs bg-white/90 border-gray-400 text-gray-700 hover:bg-white hover:text-gray-900"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm whitespace-pre-wrap text-gray-900">{note.text}</p>
            <p className="text-xs text-gray-600 mt-2">
              {new Date(note.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
} 
import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface TodoChange {
  type: "todo";
  id: Id<"todos">;
  completed: boolean;
}

interface ContactChange {
  type: "contact";
  clientId: Id<"clients">;
  field: "firstContactCompleted" | "secondContactCompleted" | "qr1Completed" | "qr2Completed" | "qr3Completed" | "qr4Completed";
  value: boolean;
}

interface DateChange {
  type: "date";
  clientId: Id<"clients">;
  field: "lastContactDate" | "lastFaceToFaceDate" | "nextAnnualAssessment" | "qr1Date" | "qr2Date" | "qr3Date" | "qr4Date";
  value: number;
}

type PendingChange = TodoChange | ContactChange | DateChange;

export function usePendingChanges() {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const toggleTodo = useMutation(api.todos.toggle);
  const updateContact = useMutation(api.clients.updateContact);

  const addTodoChange = useCallback((id: Id<"todos">, completed: boolean) => {
    setPendingChanges(prev => {
      // Remove any existing change for this todo
      const filtered = prev.filter(change => 
        !(change.type === "todo" && change.id === id)
      );
      // Add the new change
      return [...filtered, { type: "todo", id, completed }];
    });
  }, []);

  const addContactChange = useCallback((
    clientId: Id<"clients">, 
    field: ContactChange["field"], 
    value: boolean
  ) => {
    setPendingChanges(prev => {
      // Remove any existing change for this field
      const filtered = prev.filter(change => 
        !(change.type === "contact" && change.clientId === clientId && change.field === field)
      );
      // Add the new change
      return [...filtered, { type: "contact", clientId, field, value }];
    });
  }, []);

  const addDateChange = useCallback((
    clientId: Id<"clients">, 
    field: DateChange["field"], 
    value: number
  ) => {
    setPendingChanges(prev => {
      // Remove any existing change for this field
      const filtered = prev.filter(change => 
        !(change.type === "date" && change.clientId === clientId && change.field === field)
      );
      // Add the new change
      return [...filtered, { type: "date", clientId, field, value }];
    });
  }, []);

  const getTodoState = useCallback((id: Id<"todos">, originalCompleted: boolean) => {
    const change = pendingChanges.find(change => 
      change.type === "todo" && change.id === id
    ) as TodoChange | undefined;
    return change ? change.completed : originalCompleted;
  }, [pendingChanges]);

  const getContactState = useCallback((
    clientId: Id<"clients">, 
    field: ContactChange["field"], 
    originalValue: boolean
  ) => {
    const change = pendingChanges.find(change => 
      change.type === "contact" && change.clientId === clientId && change.field === field
    ) as ContactChange | undefined;
    return change ? change.value : originalValue;
  }, [pendingChanges]);

  const getDateState = useCallback((
    clientId: Id<"clients">, 
    field: DateChange["field"], 
    originalValue: number | undefined
  ) => {
    const change = pendingChanges.find(change => 
      change.type === "date" && change.clientId === clientId && change.field === field
    ) as DateChange | undefined;
    return change ? change.value : originalValue;
  }, [pendingChanges]);

  const syncChanges = useCallback(async () => {
    if (pendingChanges.length === 0) return;

    try {
      // Process all changes in parallel
      const promises = pendingChanges.map(change => {
        if (change.type === "todo") {
          return toggleTodo({ id: change.id });
        } else if (change.type === "contact") {
          return updateContact({
            id: change.clientId,
            field: change.field,
            value: change.value
          });
        } else {
          return updateContact({
            id: change.clientId,
            field: change.field,
            value: change.value
          });
        }
      });

      await Promise.all(promises);
      setPendingChanges([]);
    } catch (error) {
      console.error("Failed to sync changes:", error);
      // Keep the changes in case user wants to retry
      throw error;
    }
  }, [pendingChanges, toggleTodo, updateContact]);

  const clearChanges = useCallback(() => {
    setPendingChanges([]);
  }, []);

  return {
    addTodoChange,
    addContactChange,
    addDateChange,
    getTodoState,
    getContactState,
    getDateState,
    syncChanges,
    clearChanges,
    hasPendingChanges: pendingChanges.length > 0
  };
} 
import { useState, useCallback, useRef, useEffect } from "react";
import { Socket } from "socket.io-client";

/**
 * Action State Hook - Manages loading states with debouncing and timeout
 * 
 * Best practices implemented:
 * - Immediate button disable (optimistic)
 * - Debouncing to prevent duplicate actions
 * - Timeout handling (auto-reset after 5s if no response)
 * - Server acknowledgment pattern
 * 
 * Usage:
 * const { isLoading, executeAction, clearAction } = useActionState(socket);
 * 
 * <Button 
 *   loading={isLoading('vote')}
 *   onClick={() => executeAction('vote', 'playerVote', { cardId })}
 * >
 *   Vote
 * </Button>
 */

interface ActionOptions {
  /** Timeout in ms before auto-clearing loading state (default: 5000) */
  timeout?: number;
  /** Callback on success */
  onSuccess?: (data?: any) => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Callback on timeout */
  onTimeout?: () => void;
}

interface PendingAction {
  timeoutId: NodeJS.Timeout;
  startTime: number;
}

export function useActionState(socket: Socket | null) {
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());
  const pendingActionsRef = useRef<Map<string, PendingAction>>(new Map());
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Clear all pending timeouts
      for (const action of pendingActionsRef.current.values()) {
        clearTimeout(action.timeoutId);
      }
      pendingActionsRef.current.clear();
    };
  }, []);

  /**
   * Clear a pending action (called on success, error, or timeout)
   */
  const clearAction = useCallback((actionKey: string) => {
    const pending = pendingActionsRef.current.get(actionKey);
    if (pending) {
      clearTimeout(pending.timeoutId);
      pendingActionsRef.current.delete(actionKey);
    }
    if (mountedRef.current) {
      setPendingActions((prev) => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
    }
  }, []);

  /**
   * Execute an action with loading state, debouncing, and timeout
   */
  const executeAction = useCallback(
    (
      actionKey: string,
      emitEvent: string,
      payload: any,
      options: ActionOptions = {}
    ) => {
      // Check if action is already pending (debounce)
      if (pendingActionsRef.current.has(actionKey)) {
        console.log(`Action "${actionKey}" already pending, skipping`);
        return false;
      }

      // Check socket connection
      if (!socket?.connected) {
        console.error("Socket not connected, cannot execute action");
        options.onError?.("Not connected to server");
        return false;
      }

      const timeout = options.timeout ?? 5000;

      // Mark as pending
      setPendingActions((prev) => new Set(prev).add(actionKey));

      // Set timeout for auto-clear
      const timeoutId = setTimeout(() => {
        console.warn(`Action "${actionKey}" timed out after ${timeout}ms`);
        clearAction(actionKey);
        options.onTimeout?.();
      }, timeout);

      pendingActionsRef.current.set(actionKey, {
        timeoutId,
        startTime: Date.now(),
      });

      // Listen for acknowledgment (one-time listener)
      const ackEvent = `${emitEvent}Ack`;
      const handleAck = (data: { success: boolean; error?: string }) => {
        clearAction(actionKey);
        if (data.success) {
          options.onSuccess?.(data);
        } else {
          options.onError?.(data.error || "Action failed");
        }
      };

      socket.once(ackEvent, handleAck);

      // Also clear on disconnect to avoid stuck states
      const handleDisconnect = () => {
        socket.off(ackEvent, handleAck);
        clearAction(actionKey);
        options.onError?.("Connection lost");
      };
      socket.once("disconnect", handleDisconnect);

      // Clean up disconnect listener when ack is received
      const originalHandleAck = handleAck;
      const wrappedHandleAck = (data: { success: boolean; error?: string }) => {
        socket.off("disconnect", handleDisconnect);
        originalHandleAck(data);
      };
      socket.off(ackEvent, handleAck);
      socket.once(ackEvent, wrappedHandleAck);

      // Emit the event
      socket.emit(emitEvent, payload);

      return true;
    },
    [socket, clearAction]
  );

  /**
   * Check if an action is currently loading
   */
  const isLoading = useCallback(
    (actionKey: string) => pendingActions.has(actionKey),
    [pendingActions]
  );

  /**
   * Check if any action is loading
   */
  const isAnyLoading = useCallback(
    () => pendingActions.size > 0,
    [pendingActions]
  );

  return {
    isLoading,
    isAnyLoading,
    executeAction,
    clearAction,
    pendingActions: Array.from(pendingActions),
  };
}

/**
 * Simple debounce utility for non-socket actions
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}







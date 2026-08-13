"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DESTINATION_IDS,
  type CloudExportState,
  type ConnectionState,
  type DestinationId,
  type HistoryEntry,
  type ScheduleEntry,
  type ShareLink,
} from "./types";

const STORAGE_KEY = "expense-tracker:cloud-export-center";
const HISTORY_LIMIT = 30;

function emptyConnections(): Record<DestinationId, ConnectionState> {
  const entries = DESTINATION_IDS.map((id) => [
    id,
    { status: "disconnected", accountLabel: null, lastSyncedAt: null } as ConnectionState,
  ]);
  return Object.fromEntries(entries) as Record<DestinationId, ConnectionState>;
}

function emptyState(): CloudExportState {
  return {
    connections: emptyConnections(),
    schedules: [],
    shares: [],
    history: [],
  };
}

function loadState(): CloudExportState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      connections: { ...emptyConnections(), ...parsed.connections },
      schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
      shares: Array.isArray(parsed.shares) ? parsed.shares : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return emptyState();
  }
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useExportCenterState() {
  const [state, setState] = useState<CloudExportState>(emptyState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setState(loadState());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, isLoaded]);

  const setConnection = useCallback((destination: DestinationId, patch: Partial<ConnectionState>) => {
    setState((prev) => ({
      ...prev,
      connections: {
        ...prev.connections,
        [destination]: { ...prev.connections[destination], ...patch },
      },
    }));
  }, []);

  const addSchedule = useCallback((entry: Omit<ScheduleEntry, "id" | "createdAt" | "enabled">) => {
    const schedule: ScheduleEntry = {
      ...entry,
      id: generateId(),
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, schedules: [schedule, ...prev.schedules] }));
  }, []);

  const toggleSchedule = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    }));
  }, []);

  const removeSchedule = useCallback((id: string) => {
    setState((prev) => ({ ...prev, schedules: prev.schedules.filter((s) => s.id !== id) }));
  }, []);

  const addShare = useCallback((share: Omit<ShareLink, "id" | "createdAt" | "revoked">) => {
    const link: ShareLink = {
      ...share,
      id: generateId(),
      createdAt: new Date().toISOString(),
      revoked: false,
    };
    setState((prev) => ({ ...prev, shares: [link, ...prev.shares] }));
    return link;
  }, []);

  const revokeShare = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      shares: prev.shares.map((s) => (s.id === id ? { ...s, revoked: true } : s)),
    }));
  }, []);

  const addHistoryEntry = useCallback((entry: Omit<HistoryEntry, "id" | "timestamp">) => {
    const record: HistoryEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, history: [record, ...prev.history].slice(0, HISTORY_LIMIT) }));
    return record;
  }, []);

  return {
    ...state,
    isLoaded,
    setConnection,
    addSchedule,
    toggleSchedule,
    removeSchedule,
    addShare,
    revokeShare,
    addHistoryEntry,
  };
}

export type ExportCenterState = ReturnType<typeof useExportCenterState>;

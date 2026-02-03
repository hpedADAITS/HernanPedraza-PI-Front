import { useState, useCallback } from "react";
import { eventsAPI } from "@/services/api";

interface Event {
  id: string;
  name: string;
  description?: string;
  accessCode: string;
  state: string;
  startsAt: string;
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEvent = useCallback(async (name: string, description: string, startsAt: string) => {
    setLoading(true);
    setError(null);
    try {
      const event = await eventsAPI.createEvent(name, description, startsAt);
      setCurrentEvent(event);
      return event;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create event";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const listEvents = useCallback(async (limit = 50, skip = 0) => {
    setLoading(true);
    setError(null);
    try {
      const eventList = await eventsAPI.listEvents(limit, skip);
      setEvents(eventList);
      return eventList;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load events";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getEvent = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const event = await eventsAPI.getEvent(eventId);
      setCurrentEvent(event);
      return event;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load event";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEvent = useCallback(async (eventId: string, updates: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const event = await eventsAPI.updateEvent(eventId, updates);
      setCurrentEvent(event);
      return event;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update event";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startEvent = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const event = await eventsAPI.startEvent(eventId);
      setCurrentEvent(event);
      return event;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start event";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const endEvent = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const event = await eventsAPI.endEvent(eventId);
      setCurrentEvent(event);
      return event;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to end event";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    currentEvent,
    loading,
    error,
    createEvent,
    listEvents,
    getEvent,
    updateEvent,
    startEvent,
    endEvent,
  };
}

import { useCallback } from 'react';
import { useStorage } from './useStorage';
import { generateId } from '../utils/helpers';

export function useTrips() {
  const [trips, setTrips] = useStorage('packright_trips', []);

  const createTrip = useCallback((data) => {
    const trip = {
      status: 'planning',
      travelersCount: 1,
      notes: '',
      destination: '',
      startDate: '',
      endDate: '',
      tripType: 'other',
      templateId: null,
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTrips((prev) => [trip, ...prev]);
    return trip;
  }, [setTrips]);

  const updateTrip = useCallback((id, data) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
      )
    );
  }, [setTrips]);

  const deleteTrip = useCallback((id) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }, [setTrips]);

  const archiveTrip = useCallback((id) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: 'archived', updatedAt: new Date().toISOString() }
          : t
      )
    );
  }, [setTrips]);

  return { trips, setTrips, createTrip, updateTrip, deleteTrip, archiveTrip };
}

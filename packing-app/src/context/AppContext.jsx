import { createContext, useContext, useCallback } from 'react';
import { useTrips } from '../hooks/useTrips';
import { useItems } from '../hooks/useItems';
import { useStorage } from '../hooks/useStorage';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { BUILT_IN_TEMPLATES } from '../data/templates';
import { generateId } from '../utils/helpers';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const tripsHook = useTrips();
  const itemsHook = useItems();

  const [categories, setCategories] = useStorage(
    'packright_categories',
    DEFAULT_CATEGORIES
  );

  const [userTemplates, setUserTemplates] = useStorage(
    'packright_user_templates',
    []
  );

  const templates = [...BUILT_IN_TEMPLATES, ...userTemplates];

  /**
   * Duplicate a trip: creates a new trip (title suffixed with "Copy"),
   * clears dates, resets status to planning, and copies all items unpacked.
   * Returns the new trip id.
   */
  const duplicateTrip = useCallback(
    (tripId) => {
      const original = tripsHook.trips.find((t) => t.id === tripId);
      if (!original) return null;

      const newTripId = generateId();
      const newTrip = {
        ...original,
        id: newTripId,
        title: `${original.title} (Copy)`,
        status: 'planning',
        startDate: '',
        endDate: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      tripsHook.setTrips((prev) => [newTrip, ...prev]);
      itemsHook.duplicateItemsForTrip(tripId, newTripId);

      return newTripId;
    },
    [tripsHook, itemsHook]
  );

  /**
   * Fully delete a trip and all its items.
   */
  const deleteTrip = useCallback(
    (tripId) => {
      tripsHook.deleteTrip(tripId);
      itemsHook.deleteItemsForTrip(tripId);
    },
    [tripsHook, itemsHook]
  );

  /**
   * Save a new user-created template from the current trip's items.
   */
  const saveAsTemplate = useCallback(
    (tripId, templateName, tripType) => {
      const tripItems = itemsHook.getItemsForTrip(tripId);
      const template = {
        id: generateId(),
        name: templateName,
        tripType: tripType || 'other',
        description: `Custom template created from a trip.`,
        isBuiltIn: false,
        createdAt: new Date().toISOString(),
        items: tripItems.map((item, index) => ({
          id: generateId(),
          categoryId: item.categoryId,
          name: item.name,
          quantity: item.quantity,
          essential: item.essential,
          orderIndex: index,
        })),
      };
      setUserTemplates((prev) => [template, ...prev]);
      return template;
    },
    [itemsHook, setUserTemplates]
  );

  const deleteUserTemplate = useCallback(
    (templateId) => {
      setUserTemplates((prev) => prev.filter((t) => t.id !== templateId));
    },
    [setUserTemplates]
  );

  const value = {
    /* Trips */
    trips: tripsHook.trips,
    createTrip: tripsHook.createTrip,
    updateTrip: tripsHook.updateTrip,
    archiveTrip: tripsHook.archiveTrip,
    deleteTrip,
    duplicateTrip,

    /* Items */
    items: itemsHook.items,
    getItemsForTrip: itemsHook.getItemsForTrip,
    addItem: itemsHook.addItem,
    updateItem: itemsHook.updateItem,
    togglePacked: itemsHook.togglePacked,
    deleteItem: itemsHook.deleteItem,
    addItemsFromTemplate: itemsHook.addItemsFromTemplate,
    getProgress: itemsHook.getProgress,

    /* Categories */
    categories,
    setCategories,

    /* Templates */
    templates,
    userTemplates,
    saveAsTemplate,
    deleteUserTemplate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/** @returns {ReturnType<typeof AppProvider>} */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}

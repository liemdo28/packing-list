import { useCallback } from 'react';
import { useStorage } from './useStorage';
import { generateId, computeProgress } from '../utils/helpers';

export function useItems() {
  const [items, setItems] = useStorage('packright_items', []);

  const getItemsForTrip = useCallback(
    (tripId) => items.filter((i) => i.tripId === tripId),
    [items]
  );

  const addItem = useCallback((data) => {
    const item = {
      quantity: 1,
      packed: false,
      essential: false,
      notes: '',
      orderIndex: 0,
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, item]);
    return item;
  }, [setItems]);

  const updateItem = useCallback((id, data) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
  }, [setItems]);

  const togglePacked = useCallback((id) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, packed: !i.packed } : i))
    );
  }, [setItems]);

  const deleteItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, [setItems]);

  const deleteItemsForTrip = useCallback((tripId) => {
    setItems((prev) => prev.filter((i) => i.tripId !== tripId));
  }, [setItems]);

  /** Apply a template's items to a trip, skipping any already present. */
  const addItemsFromTemplate = useCallback((tripId, templateItems) => {
    const newItems = templateItems.map((ti, index) => ({
      id: generateId(),
      tripId,
      categoryId: ti.categoryId,
      name: ti.name,
      quantity: ti.quantity ?? 1,
      packed: false,
      essential: ti.essential ?? false,
      notes: '',
      orderIndex: index,
      createdAt: new Date().toISOString(),
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, [setItems]);

  /** Duplicate all items from one trip to another. */
  const duplicateItemsForTrip = useCallback((sourceTripId, newTripId) => {
    setItems((prev) => {
      const sourceItems = prev.filter((i) => i.tripId === sourceTripId);
      const copies = sourceItems.map((i) => ({
        ...i,
        id: generateId(),
        tripId: newTripId,
        packed: false,
        createdAt: new Date().toISOString(),
      }));
      return [...prev, ...copies];
    });
  }, [setItems]);

  const getProgress = useCallback(
    (tripId) => computeProgress(items.filter((i) => i.tripId === tripId)),
    [items]
  );

  return {
    items,
    setItems,
    getItemsForTrip,
    addItem,
    updateItem,
    togglePacked,
    deleteItem,
    deleteItemsForTrip,
    addItemsFromTemplate,
    duplicateItemsForTrip,
    getProgress,
  };
}

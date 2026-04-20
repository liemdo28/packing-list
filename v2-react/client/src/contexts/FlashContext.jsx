import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const FlashContext = createContext(null);

/**
 * Flash message system for v2-react client.
 *
 * Usage:
 *   import { useFlash } from '../contexts/FlashContext';
 *
 *   function MyComponent() {
 *     const { flash } = useFlash();
 *     flash('Order created!', 'success');
 *     flash('Something went wrong', 'error');
 *   }
 *
 * Display in Layout.jsx:
 *   <FlashProvider>
 *     <Layout />  ← must be inside FlashProvider
 *   </FlashProvider>
 *
 *   Then inside Layout, render <FlashMessages />.
 */
export function FlashProvider({ children }) {
  const [messages, setMessages] = useState([]);

  const flash = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setMessages((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }, duration);
    }
  }, []);

  const dismiss = useCallback((id) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <FlashContext.Provider value={{ flash }}>
      {children}
      <FlashMessages messages={messages} onDismiss={dismiss} />
    </FlashContext.Provider>
  );
}

export function useFlash() {
  const ctx = useContext(FlashContext);
  if (!ctx) throw new Error('useFlash must be used within FlashProvider');
  return ctx;
}

/**
 * Renders a fixed stack of flash messages in the top-right corner.
 * Place <FlashMessages /> inside FlashProvider children (or in Layout).
 */
export function FlashMessages({ messages, onDismiss }) {
  if (!messages.length) return null;

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error:   'bg-red-50    text-red-800    border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info:    'bg-blue-50   text-blue-800   border-blue-200',
  };

  const icons = {
    success: (
      <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.18 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
    >
      {messages.map(({ id, message, type }) => (
        <div
          key={id}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm
            animate-in slide-in-from-right duration-200 ${colors[type] || colors.info}`}
          role="alert"
        >
          {icons[type] || icons.info}
          <p className="flex-1">{message}</p>
          <button
            onClick={() => onDismiss(id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface StockUpdate {
  productId: string;
  stockQuantity: number;
  timestamp: string;
}

interface BulkStockUpdate {
  updates: Array<{ productId: string; stockQuantity: number }>;
  timestamp: string;
}

interface OrderStatusUpdate {
  orderId: string;
  status: string;
  userId: string;
  timestamp: string;
}

interface NewVendorOrder {
  vendorId: string;
  order: any;
  timestamp: string;
}

interface PriceUpdate {
  productId: string;
  price: number;
  compareAtPrice?: number;
  timestamp: string;
}

interface ProductRatingUpdate {
  productId: string;
  averageRating: number;
  reviewCount: number;
  timestamp: string;
}

interface MarketplaceWebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  stockUpdates: Map<string, number>;
  subscribeToStockUpdates: (callback: (update: StockUpdate) => void) => () => void;
  subscribeToBulkStockUpdates: (callback: (update: BulkStockUpdate) => void) => () => void;
  subscribeToOrderStatusUpdates: (callback: (update: OrderStatusUpdate) => void) => () => void;
  subscribeToNewVendorOrders: (callback: (update: NewVendorOrder) => void) => () => void;
  subscribeToPriceUpdates: (callback: (update: PriceUpdate) => void) => () => void;
  subscribeToRatingUpdates: (callback: (update: ProductRatingUpdate) => void) => () => void;
}

const MarketplaceWebSocketContext = createContext<MarketplaceWebSocketContextType | undefined>(undefined);

export const useStockWebSocket = () => {
  const context = useContext(MarketplaceWebSocketContext);
  if (!context) {
    throw new Error('useStockWebSocket must be used within StockWebSocketProvider');
  }
  return context;
};

export const useMarketplaceWebSocket = () => {
  const context = useContext(MarketplaceWebSocketContext);
  if (!context) {
    throw new Error('useMarketplaceWebSocket must be used within StockWebSocketProvider');
  }
  return context;
};

interface StockWebSocketProviderProps {
  children: React.ReactNode;
}

export const StockWebSocketProvider: React.FC<StockWebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stockUpdates, setStockUpdates] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    // Connect to WebSocket server
    // Remove /api/v1 from the API URL for WebSocket connection
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const wsUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
    
    const socketInstance = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('stockUpdated', (data: StockUpdate) => {
      console.log('Stock updated:', data);
      setStockUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.set(data.productId, data.stockQuantity);
        return newMap;
      });
    });

    socketInstance.on('bulkStockUpdated', (data: BulkStockUpdate) => {
      console.log('Bulk stock updated:', data);
      setStockUpdates((prev) => {
        const newMap = new Map(prev);
        data.updates.forEach(({ productId, stockQuantity }) => {
          newMap.set(productId, stockQuantity);
        });
        return newMap;
      });
    });

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      console.log('Cleaning up WebSocket connection');
      socketInstance.disconnect();
    };
  }, []);

  const subscribeToStockUpdates = useCallback((callback: (update: StockUpdate) => void) => {
    if (!socket) return () => {};
    socket.on('stockUpdated', callback);
    return () => {
      socket.off('stockUpdated', callback);
    };
  }, [socket]);

  const subscribeToBulkStockUpdates = useCallback((callback: (update: BulkStockUpdate) => void) => {
    if (!socket) return () => {};
    socket.on('bulkStockUpdated', callback);
    return () => {
      socket.off('bulkStockUpdated', callback);
    };
  }, [socket]);

  const subscribeToOrderStatusUpdates = useCallback((callback: (update: OrderStatusUpdate) => void) => {
    if (!socket) return () => {};
    socket.on('orderStatusUpdated', callback);
    return () => {
      socket.off('orderStatusUpdated', callback);
    };
  }, [socket]);

  const subscribeToNewVendorOrders = useCallback((callback: (update: NewVendorOrder) => void) => {
    if (!socket) return () => {};
    socket.on('newVendorOrder', callback);
    return () => {
      socket.off('newVendorOrder', callback);
    };
  }, [socket]);

  const subscribeToPriceUpdates = useCallback((callback: (update: PriceUpdate) => void) => {
    if (!socket) return () => {};
    socket.on('priceUpdated', callback);
    return () => {
      socket.off('priceUpdated', callback);
    };
  }, [socket]);

  const subscribeToRatingUpdates = useCallback((callback: (update: ProductRatingUpdate) => void) => {
    if (!socket) return () => {};
    socket.on('productRatingUpdated', callback);
    return () => {
      socket.off('productRatingUpdated', callback);
    };
  }, [socket]);

  const value: MarketplaceWebSocketContextType = {
    socket,
    isConnected,
    stockUpdates,
    subscribeToStockUpdates,
    subscribeToBulkStockUpdates,
    subscribeToOrderStatusUpdates,
    subscribeToNewVendorOrders,
    subscribeToPriceUpdates,
    subscribeToRatingUpdates,
  };

  return (
    <MarketplaceWebSocketContext.Provider value={value}>
      {children}
    </MarketplaceWebSocketContext.Provider>
  );
};

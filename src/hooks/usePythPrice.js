import { useState, useEffect, useRef, useCallback } from 'react';

// Price Feed IDs for Pyth Hermes
export const PRICE_FEEDS = {
  BTC: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  ETH: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  SOL: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d'
};

const HERMES_WS_URL = 'wss://hermes.pyth.network/ws';

export const usePythPrice = () => {
  const [prices, setPrices] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const retryTimeout = useRef(null);
  const pricesRef = useRef({});

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      ws.current = new WebSocket(HERMES_WS_URL);

      ws.current.onopen = () => {
        console.log('Connected to Pyth Hermes WS');
        setIsConnected(true);
        
        // Subscribe to all feeds
        const msg = {
          type: 'subscribe',
          ids: Object.values(PRICE_FEEDS)
        };
        ws.current.send(JSON.stringify(msg));
      };

      ws.current.onclose = () => {
        console.log('Pyth Hermes WS disconnected');
        setIsConnected(false);
        // Retry connection after 3 seconds
        retryTimeout.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = (err) => {
        console.error('Pyth Hermes WS error:', err);
        ws.current?.close();
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'price_update' && data.price_feed) {
            const { id, price } = data.price_feed;
            
            // Calculate actual price: price * 10^expo
            const actualPrice = Number(price.price) * Math.pow(10, price.expo);
            
            // Update ref for stable access
            pricesRef.current[id] = actualPrice;

            setPrices(prev => ({
              ...prev,
              [id]: actualPrice
            }));
          }
        } catch (e) {
          console.error('Error parsing Pyth message:', e);
        }
      };
    } catch (e) {
      console.error('Connection error:', e);
      retryTimeout.current = setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
    };
  }, [connect]);

  // Helper to get price by symbol - now stable
  const getPrice = useCallback((symbol) => {
    const id = PRICE_FEEDS[symbol];
    return pricesRef.current[id] || null;
  }, []);

  return { prices, getPrice, isConnected };
};

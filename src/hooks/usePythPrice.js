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
    console.log('[WebSocket] Attempting to connect...');
    console.log('[WebSocket] Current state:', ws.current?.readyState);
    
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected, skipping');
      return;
    }

    try {
      console.log('[WebSocket] Creating new WebSocket connection to:', HERMES_WS_URL);
      ws.current = new WebSocket(HERMES_WS_URL);
      console.log('[WebSocket] WebSocket object created, readyState:', ws.current.readyState);

      ws.current.onopen = () => {
        console.log('✅ [WebSocket] Connected to Pyth Hermes WS');
        console.log('[WebSocket] Connection readyState:', ws.current.readyState);
        setIsConnected(true);
        
        // Subscribe to all feeds
        const msg = {
          type: 'subscribe',
          ids: Object.values(PRICE_FEEDS)
        };
        console.log('[WebSocket] Sending subscription message:', msg);
        ws.current.send(JSON.stringify(msg));
        console.log('[WebSocket] Subscription message sent');
      };

      ws.current.onclose = (event) => {
        console.log('❌ [WebSocket] Connection closed');
        console.log('[WebSocket] Close code:', event.code);
        console.log('[WebSocket] Close reason:', event.reason);
        console.log('[WebSocket] Was clean:', event.wasClean);
        setIsConnected(false);
        // Retry connection after 3 seconds
        console.log('[WebSocket] Scheduling reconnect in 3 seconds...');
        retryTimeout.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = (err) => {
        console.error('⚠️ [WebSocket] Error occurred:', err);
        console.error('[WebSocket] Error type:', err.type);
        console.error('[WebSocket] Error target readyState:', err.target?.readyState);
        ws.current?.close();
      };

      ws.current.onmessage = (event) => {
        console.log('[WebSocket] Message received');
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] Parsed data:', data);
          
          if (data.type === 'price_update' && data.price_feed) {
            const { id, price } = data.price_feed;
            console.log('[WebSocket] Price update for feed:', id);
            console.log('[WebSocket] Raw price:', price.price, 'Expo:', price.expo);
            
            // Calculate actual price: price * 10^expo
            const actualPrice = Number(price.price) * Math.pow(10, price.expo);
            console.log('[WebSocket] Calculated price:', actualPrice);
            
            // Update ref for stable access
            pricesRef.current[id] = actualPrice;

            setPrices(prev => ({
              ...prev,
              [id]: actualPrice
            }));
          } else {
            console.log('[WebSocket] Non-price message type:', data.type);
          }
        } catch (e) {
          console.error('❌ [WebSocket] Error parsing message:', e);
          console.error('[WebSocket] Raw message data:', event.data);
        }
      };
    } catch (e) {
      console.error('❌ [WebSocket] Connection error:', e);
      console.error('[WebSocket] Error stack:', e.stack);
      console.log('[WebSocket] Scheduling reconnect after error...');
      retryTimeout.current = setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    console.log('[WebSocket] useEffect - Initializing connection');
    connect();

    return () => {
      console.log('[WebSocket] useEffect - Cleanup, closing connection');
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
    const price = pricesRef.current[id] || null;
    console.log(`[WebSocket] getPrice called for ${symbol} (${id}):`, price);
    return price;
  }, []);

  return { prices, getPrice, isConnected };
};

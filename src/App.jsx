import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePythPrice } from './hooks/usePythPrice';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  ShieldAlert, 
  RotateCw, 
  History, 
  Trophy, 
  Info,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Lock
} from 'lucide-react';

// --- Configuration & Constants ---
const ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', vol: 0.15, color: 'text-orange-400' },
  { symbol: 'ETH', name: 'Ethereum', vol: 0.25, color: 'text-blue-400' },
  { symbol: 'SOL', name: 'Solana', vol: 0.45, color: 'text-purple-400' },
];

const MULTIPLIERS = [10, 25, 50, 100, 150, 200, 250];
const STAKES = [5, 10, 25, 50, 100];
const DURATIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45]; // Duration in seconds

// --- Components ---

const PriceChart = ({ history, entryPrice, sl, dir, status, isSimulated }) => {
  if (!history || history.length < 2) return <div className="h-48 w-full bg-zinc-900/20" />;

  const width = 1000;
  const height = 200;
  const padding = 40;
  
  // Calculate dynamic range based on history and key levels
  const dataMin = Math.min(...history);
  const dataMax = Math.max(...history);
  
  // Always include SL in view, plus padding
  const minPnl = Math.min(sl, dataMin) - 0.05;
  // Always include at least some upside (0.15), extend if price goes higher
  const maxPnl = Math.max(0.15, dataMax) + 0.05;

  const getX = (i) => (i / (history.length - 1)) * width;
  const getY = (pnl) => height - padding - ((pnl - minPnl) / (maxPnl - minPnl)) * (height - 2 * padding);

  const points = history.map((pnl, i) => `${getX(i)},${getY(pnl)}`).join(' ');
  const currentPnl = history[history.length - 1];

  return (
    <div className="relative w-full h-48 bg-zinc-950/50 border border-zinc-900 rounded-sm overflow-hidden mt-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-3d" preserveAspectRatio="none">
        
        <line x1="0" y1={getY(0)} x2={width} y2={getY(0)} stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" opacity="0.2" />
        
        <line x1="0" y1={getY(sl)} x2={width} y2={getY(sl)} stroke="#f43f5e" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
        <text x="5" y={getY(sl) + 15} fill="#f43f5e" fontSize="12" className="font-mono font-bold opacity-60">LIQUIDATION (SL)</text>

        <polyline
          fill="none"
          stroke={currentPnl >= 0 ? "#10b981" : "#f43f5e"}
          strokeWidth="3"
          strokeLinejoin="round"
          points={points}
        />
        
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
           <stop offset="0%" stopColor={currentPnl >= 0 ? "#10b981" : "#f43f5e"} stopOpacity="0.2" />
           <stop offset="100%" stopColor={currentPnl >= 0 ? "#10b981" : "#f43f5e"} stopOpacity="0" />
        </linearGradient>
        <path
          d={`M ${points} L ${getX(history.length - 1)},${height} L 0,${height} Z`}
          fill="url(#chartGradient)"
        />

        <circle
          cx={getX(history.length - 1)}
          cy={getY(currentPnl)}
          r="4"
          fill={currentPnl >= 0 ? "#10b981" : "#f43f5e"}
        >
          <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
        </circle>
      </svg>
      
      {status === 'OPEN' && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-black/40 border border-zinc-800 rounded-xs">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSimulated ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span className="text-[10px] font-bold tracking-tighter text-zinc-400">
            {isSimulated ? 'SIMULATION' : 'PYTH FEED'}
          </span>
        </div>
      )}
    </div>
  );
};

const Reel = ({ label, value, isSpinning, items = [], colorClass, delay }) => {
  // Create a continuous strip of items for the spinning animation
  const spinItems = useMemo(() => {
    if (!items.length) return [];
    // Repeat items enough times to create a smooth loop effect
    // If items are few, repeat more. Target around 20-30 items total.
    const copies = Math.ceil(30 / items.length);
    return Array(copies).fill(items).flat();
  }, [items]);

  return (
    <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-sm h-32 flex flex-col items-center justify-center relative overflow-hidden group">
      <div className="absolute top-2 left-2 text-[10px] text-zinc-600 font-mono uppercase tracking-widest leading-none">
        {label}
      </div>
      
      <AnimatePresence mode="wait">
        {isSpinning ? (
          <div className="absolute inset-0 flex flex-col items-center">
             <motion.div
               animate={{ y: ["0%", "-50%"] }}
               transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
               className="flex flex-col items-center"
             >
               {spinItems.map((item, i) => (
                 <div
                   key={i}
                   className={`h-32 flex items-center justify-center text-2xl font-black font-mono tracking-tighter opacity-50 blur-[1px] ${item.color || 'text-zinc-600'}`}
                 >
                   {item.value}
                 </div>
               ))}
             </motion.div>
          </div>
        ) : (
          <motion.div
            key="result"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200, delay }}
            className={`text-2xl font-black font-mono tracking-tighter ${colorClass}`}
          >
            {value || '---'}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-transparent via-white/5 to-transparent opacity-20" />
    </div>
  );
};

const StatusLight = ({ active, pending }) => (
  <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : pending ? 'bg-amber-500 animate-pulse' : 'bg-zinc-800'}`} />
);

export default function App() {
  const [balance, setBalance] = useState(1000);
  const [stake, setStake] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [pendingTrade, setPendingTrade] = useState(null);
  const [activeTrade, setActiveTrade] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [spinResults, setSpinResults] = useState(null);
  
  const { getPrice, isConnected } = usePythPrice();

  const triggerHaptic = () => { if (window.navigator.vibrate) window.navigator.vibrate(10); };

  // Logic to handle the countdown before entry
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        triggerHaptic();
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished, finalize the trade
      // Get the real entry price at this exact moment
      const realPrice = getPrice(pendingTrade.asset.symbol);
      
      const isSimulated = !realPrice;
      const entryPrice = realPrice || 100;

      setActiveTrade({
        ...pendingTrade,
        entryPrice: entryPrice,
        currentPrice: entryPrice,
        startTime: Date.now(),
        status: 'OPEN',
        isSimulated
      });
      setPendingTrade(null);
      setCountdown(null);
    }
  }, [countdown, pendingTrade, getPrice]);

  const startSpin = () => {
    if (balance < stake) return;
    if (!isConnected && !confirm("Market Offline (WebSocket Disconnected). Play in Simulation Mode?")) return;
    
    setBalance(prev => prev - stake);
    setIsSpinning(true);
    setActiveTrade(null);
    setPendingTrade(null);
    setCountdown(null);
    setShowResultModal(false);
    setSpinResults(null);
    triggerHaptic();

    // Select outcomes upfront
    const asset = ASSETS[Math.floor(Math.random() * ASSETS.length)];
    const dir = Math.random() > 0.5 ? 'LONG' : 'SHORT';
    const mult = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
    const duration = DURATIONS[Math.floor(Math.random() * DURATIONS.length)];

    // Sequence the reveal
    // 1. Reveal Asset
    setTimeout(() => {
      setSpinResults({ asset });
      triggerHaptic();
    }, 800);

    // 2. Reveal Vector (Direction)
    setTimeout(() => {
      setSpinResults(prev => ({ ...prev, dir }));
      triggerHaptic();
    }, 1800);

    // 3. Reveal Multiplier
    setTimeout(() => {
      setSpinResults(prev => ({ ...prev, mult }));
      triggerHaptic();
    }, 2800);

    // 4. Reveal Duration
    setTimeout(() => {
      setSpinResults(prev => ({ ...prev, duration }));
      triggerHaptic();
      
      // 5. Finalize
      setTimeout(() => {
        setIsSpinning(false);
        setPendingTrade({
          asset,
          dir,
          mult,
          duration,
          stake,
          entryPrice: 0, // Will be set at countdown end
          currentPrice: 0,
          sl: -1.0, // Stop loss is always -100% (full stake)
          pnl: 0,
          history: [0]
        });
        setCountdown(3);
        setSpinResults(null);
      }, 600);
    }, 3800);
  };

  useEffect(() => {
    if (!activeTrade || activeTrade.status !== 'OPEN') return;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - activeTrade.startTime) / 1000;
      
      let newPrice;
      const realPrice = getPrice(activeTrade.asset.symbol);

      if (!activeTrade.isSimulated && realPrice) {
        newPrice = realPrice;
      } else {
        // Fallback simulation if price stream drops OR if we started in simulation mode
        const volatility = activeTrade.asset.vol * (activeTrade.mult / 10);
        const change = (Math.random() - 0.5) * volatility;
        newPrice = activeTrade.currentPrice * (1 + change);
      }
      
      const priceChangePct = (newPrice - activeTrade.entryPrice) / activeTrade.entryPrice;
      const dirMult = activeTrade.dir === 'LONG' ? 1 : -1;
      const currentPnl = priceChangePct * activeTrade.mult * dirMult;

      let closedStatus = null;
      // Only check for stop loss or time expiry (no take profit)
      if (currentPnl <= activeTrade.sl) closedStatus = 'STOP_LOSS';
      else if (elapsed >= activeTrade.duration) closedStatus = 'TIME_EXPIRY';

      if (closedStatus) {
        const finalPnlValue = Math.max(-1, currentPnl);
        const payout = activeTrade.stake + (activeTrade.stake * finalPnlValue);
        
        setBalance(prev => prev + payout);
        setHistory(prev => [{
          ...activeTrade,
          status: closedStatus,
          finalPnl: finalPnlValue,
          payout,
          id: Date.now()
        }, ...prev].slice(0, 10));
        
        setActiveTrade(prev => ({ 
          ...prev, 
          status: closedStatus, 
          pnl: finalPnlValue,
          currentPrice: newPrice,
          history: [...prev.history, finalPnlValue].slice(-100)
        }));
        
        setShowResultModal(true);
        clearInterval(timer);
      } else {
        setActiveTrade(prev => ({ 
          ...prev, 
          pnl: currentPnl, 
          currentPrice: newPrice,
          history: [...prev.history, currentPnl].slice(-100)
        }));
      }
    }, 100);

    return () => clearInterval(timer);
  }, [activeTrade, getPrice]);

  // Display value for reels - check active or pending
  const currentAsset = activeTrade?.asset || pendingTrade?.asset || spinResults?.asset;
  const currentDir = activeTrade?.dir || pendingTrade?.dir || spinResults?.dir;
  const currentMult = activeTrade?.mult || pendingTrade?.mult || spinResults?.mult;
  const currentDuration = activeTrade?.duration || pendingTrade?.duration || spinResults?.duration;

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-mono selection:bg-emerald-500/30">
      
      <nav className="h-16 border-b border-zinc-900 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 flex items-center justify-center rounded-sm transition-colors duration-500 ${isConnected ? 'bg-emerald-500' : 'bg-zinc-800'}`}>
            <Zap className={`w-5 h-5 ${isConnected ? 'text-black fill-current' : 'text-zinc-500'}`} />
          </div>
          <span className="font-black tracking-tighter text-xl">TERMINAL.SPIN</span>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Available Credit</span>
            <span className="text-xl font-bold text-emerald-400 leading-none">
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors relative"
          >
            <History className="w-5 h-5 text-zinc-400" />
            {history.length > 0 && <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full" />}
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
        
        <div className="w-full flex gap-3 mb-8">
          <Reel 
            label="Asset" 
            value={currentAsset?.symbol} 
            isSpinning={isSpinning && !currentAsset}
            items={ASSETS.map(a => ({ value: a.symbol, color: a.color }))}
            colorClass={currentAsset?.color || 'text-zinc-500'}
            delay={0}
          />
          <Reel 
            label="Vector" 
            value={currentDir} 
            isSpinning={isSpinning && !currentDir}
            items={[
              { value: 'LONG', color: 'text-emerald-500' },
              { value: 'SHORT', color: 'text-rose-500' }
            ]}
            colorClass={currentDir === 'LONG' ? 'text-emerald-500' : 'text-rose-500'}
            delay={0}
          />
          <Reel 
            label="leverage" 
            value={currentMult ? `${currentMult}x` : ''} 
            isSpinning={isSpinning && !currentMult}
            items={MULTIPLIERS.map(m => ({ value: `${m}x`, color: 'text-amber-400' }))}
            colorClass="text-amber-400"
            delay={0}
          />
          <Reel 
            label="Duration" 
            value={currentDuration ? `${currentDuration}s` : ''} 
            isSpinning={isSpinning && !currentDuration}
            items={DURATIONS.map(d => ({ value: `${d}s`, color: 'text-cyan-400' }))}
            colorClass="text-cyan-400"
            delay={0}
          />
        </div>

        <div className="w-full bg-zinc-950 border border-zinc-900 rounded-sm p-6 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!activeTrade && !isSpinning && !pendingTrade ? (
              <motion.div 
                key="awaiting"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="h-64 flex flex-col items-center justify-center text-zinc-600 space-y-4"
              >
                <Activity className="w-8 h-8 opacity-20" />
                <p className="text-xs uppercase tracking-[0.2em] animate-pulse">Awaiting Signal Entry</p>
              </motion.div>
            ) : isSpinning ? (
              <motion.div 
                key="spinning"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="h-64 flex flex-col items-center justify-center space-y-4"
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ height: [4, 16, 4] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                      className="w-1 bg-emerald-500"
                    />
                  ))}
                </div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-500/50 font-bold">Synchronizing Oracles...</p>
              </motion.div>
            ) : countdown !== null ? (
              <motion.div 
                key="countdown"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="h-64 flex flex-col items-center justify-center space-y-2"
              >
                <Lock className="w-6 h-6 text-amber-500 mb-2 animate-bounce" />
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-500 font-black">Locking Entry Price</p>
                <motion.div 
                   key={countdown}
                   initial={{ scale: 2, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="text-7xl font-black italic tracking-tighter"
                >
                  {countdown}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                key="active"
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-sm uppercase tracking-tighter">
                        {activeTrade.asset.name} Live Terminal
                      </span>
                      <StatusLight active={activeTrade.status === 'OPEN'} />
                    </div>
                    <div className="flex items-baseline gap-3">
                      <div className={`text-5xl font-black tabular-nums tracking-tighter ${activeTrade.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        ${(activeTrade.stake * (1 + activeTrade.pnl)).toFixed(2)}
                      </div>
                      <div className={`text-2xl font-bold ${activeTrade.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {activeTrade.pnl >= 0 ? '+' : ''}{(activeTrade.pnl * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-600 uppercase tracking-widest block mb-1">Auto-Close Timer</span>
                    <div className="text-2xl font-bold font-mono">
                      {activeTrade.status === 'OPEN' ? (
                        Math.max(0, activeTrade.duration - (Date.now() - activeTrade.startTime) / 1000).toFixed(1) + 's'
                      ) : (
                        <span className="text-zinc-500">SETTLED</span>
                      )}
                    </div>
                  </div>
                </div>

                <PriceChart 
                   history={activeTrade.history}
                   entryPrice={activeTrade.entryPrice}
                   sl={activeTrade.sl}
                   dir={activeTrade.dir}
                   status={activeTrade.status}
                   isSimulated={activeTrade.isSimulated}
                />

                <div className="flex justify-between items-center text-[10px] text-zinc-600 uppercase font-black tracking-widest px-1">
                  <div className="flex gap-4">
                    <span>Entry: {activeTrade.entryPrice.toFixed(2)}</span>
                    <span className={activeTrade.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                      Value: {(activeTrade.entryPrice * (1 + (activeTrade.pnl/activeTrade.mult))).toFixed(2)}
                    </span>
                  </div>
                  <div>ID: #{activeTrade.startTime.toString().slice(-6)}</div>
                </div>

                {/* Game Result Modal */}
                <AnimatePresence>
                  {showResultModal && activeTrade && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 flex items-center justify-center p-4"
                    >
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowResultModal(false)} />
                      <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="relative bg-zinc-900 border border-zinc-800 p-8 rounded-lg shadow-2xl max-w-sm w-full text-center overflow-hidden"
                      >
                         <div className={`absolute top-0 left-0 right-0 h-1 ${activeTrade.pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        
                        <div className={`text-sm font-bold uppercase tracking-[0.3em] mb-4 ${activeTrade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {activeTrade.status.replace('_', ' ')}
                        </div>
                        
                        <div className="text-4xl font-black mb-2 tracking-tighter text-white">
                          ${(activeTrade.stake * (1 + activeTrade.pnl)).toFixed(2)}
                        </div>
                        
                        <div className={`text-xl font-bold mb-8 ${activeTrade.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {activeTrade.pnl >= 0 ? '+' : '-'}${Math.abs(activeTrade.stake * activeTrade.pnl).toFixed(2)}
                        </div>

                        <div className="flex flex-col gap-3">
                          <button 
                            onClick={startSpin}
                            className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-widest rounded-sm transition-colors"
                          >
                            Play Again
                          </button>
                          <button 
                            onClick={() => setShowResultModal(false)}
                            className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase tracking-widest rounded-sm transition-colors"
                          >
                            View Graph
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 w-full space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex gap-2">
              {STAKES.map(amt => (
                <button
                  key={amt}
                  disabled={isSpinning || !!activeTrade || countdown !== null}
                  onClick={() => setStake(amt)}
                  className={`px-4 py-2 text-sm font-mono border transition-all ${
                    stake === amt 
                      ? 'bg-white text-black border-white' 
                      : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white'
                  } disabled:opacity-20`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <button 
              onClick={startSpin}
              disabled={isSpinning || (activeTrade && activeTrade.status === 'OPEN') || countdown !== null || balance < stake}
              className={`group relative px-12 py-5 bg-zinc-900 border-2 border-zinc-800 rounded-sm overflow-hidden transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none hover:border-emerald-500/50`}
            >
              <div className="relative z-10 flex items-center gap-3">
                <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
                <span className="font-black text-xl uppercase tracking-tighter">Initialize Sequence</span>
              </div>
              <div className="absolute inset-0 bg-linear-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-full group-hover:translate-x-full duration-1000 ease-in-out" />
            </button>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-zinc-950 border-l border-zinc-900 z-50 p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black uppercase tracking-tighter italic">Activity Log</h2>
                <button onClick={() => setShowHistory(false)} className="text-zinc-500 hover:text-white">✕</button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-700 opacity-50 space-y-2">
                    <History className="w-8 h-8" />
                    <p className="text-[10px] uppercase tracking-widest font-bold">No sequences logged</p>
                  </div>
                ) : (
                  history.map(item => (
                    <div key={item.id} className="bg-zinc-900/50 border border-zinc-900 p-3 rounded-sm flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={`w-1 h-8 rounded-full ${item.finalPnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <div>
                          <div className="text-[10px] text-zinc-500 font-bold uppercase">{item.asset.symbol} • {item.mult}x {item.dir}</div>
                          <div className="font-mono text-xs">{new Date(item.id).toLocaleTimeString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-black ${item.finalPnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {item.finalPnl >= 0 ? '+' : '-'}${Math.abs(item.stake * item.finalPnl).toFixed(2)}
                        </div>
                        <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">
                          {item.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="h-10 border-t border-zinc-900 bg-zinc-950 px-6 flex items-center overflow-hidden whitespace-nowrap">
        <div className="flex animate-scroll-text gap-12 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
          {ASSETS.map(a => (
            <div key={a.symbol} className="flex items-center gap-2">
              <span className="text-white">{a.symbol}/USD</span>
              <span className="text-emerald-500 flex items-center"><ArrowUpRight className="w-3 h-3" /> +{Math.random().toFixed(2)}%</span>
            </div>
          ))}
          {ASSETS.map(a => (
            <div key={`${a.symbol}-dup`} className="flex items-center gap-2">
              <span className="text-white">{a.symbol}/USD</span>
              <span className="text-emerald-500 flex items-center"><ArrowUpRight className="w-3 h-3" /> +{Math.random().toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scroll-text {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-text {
          animation: scroll-text 30s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}

import { useState, useEffect } from 'react';

interface MarketData {
  name: string;
  value: string;
  change: string;
  positive: boolean;
}

const CACHE_KEY = 'finsight_market_data';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useMarketData = () => {
  const [data, setData] = useState<MarketData[]>([
    { name: 'S&P 500', value: '5,241.53', change: '+0.82%', positive: true },
    { name: 'Nasdaq 100', value: '18,339.44', change: '+1.15%', positive: true },
    { name: 'Bitcoin', value: '$...', change: '...', positive: true },
    { name: 'Ethereum', value: '$...', change: '...', positive: true },
    { name: 'Gold', value: '$2,178', change: '+0.12%', positive: true },
    { name: 'USD/EUR', value: '0.92', change: '-0.05%', positive: false },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        // Check cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { timestamp, data: cachedData } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setData(cachedData);
            setIsLoading(false);
            return;
          }
        }

        // Fetch real crypto data from CoinGecko
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
        if (!response.ok) throw new Error('Failed to fetch market data');
        
        const result = await response.json();
        
        const btcPrice = result.bitcoin.usd;
        const btcChange = result.bitcoin.usd_24h_change;
        const ethPrice = result.ethereum.usd;
        const ethChange = result.ethereum.usd_24h_change;

        const newData: MarketData[] = [
          { name: 'S&P 500', value: '5,241.53', change: '+0.82%', positive: true },
          { name: 'Nasdaq 100', value: '18,339.44', change: '+1.15%', positive: true },
          { 
            name: 'Bitcoin', 
            value: `$${btcPrice.toLocaleString()}`, 
            change: `${btcChange > 0 ? '+' : ''}${btcChange.toFixed(2)}%`, 
            positive: btcChange >= 0 
          },
          { 
            name: 'Ethereum', 
            value: `$${ethPrice.toLocaleString()}`, 
            change: `${ethChange > 0 ? '+' : ''}${ethChange.toFixed(2)}%`, 
            positive: ethChange >= 0 
          },
          { name: 'Gold', value: '$2,178', change: '+0.12%', positive: true },
          { name: 'USD/EUR', value: '0.92', change: '-0.05%', positive: false },
        ];

        setData(newData);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: newData }));
        setError(null);
      } catch (err) {
        console.error('Error fetching market data:', err);
        setError('Failed to load live market data. Showing cached/mock data.');
        // Fallback to mock data if fetch fails and no cache
        if (!localStorage.getItem(CACHE_KEY)) {
           setData([
            { name: 'S&P 500', value: '5,241.53', change: '+0.82%', positive: true },
            { name: 'Nasdaq 100', value: '18,339.44', change: '+1.15%', positive: true },
            { name: 'Bitcoin', value: '$68,421', change: '-2.41%', positive: false },
            { name: 'Ethereum', value: '$3,412', change: '-1.85%', positive: false },
            { name: 'Gold', value: '$2,178', change: '+0.12%', positive: true },
            { name: 'USD/EUR', value: '0.92', change: '-0.05%', positive: false },
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  return { data, isLoading, error };
};

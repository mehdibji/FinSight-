import { useEffect, useState } from "react";

export const MarketOverview = () => {
  const [data, setData] = useState(null);

  const fetchMarket = async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=eur&include_24hr_change=true"
      );
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Erreur API :", error);
    }
  };

  useEffect(() => {
    fetchMarket();

    const interval = setInterval(fetchMarket, 10000); // refresh toutes les 10s
    return () => clearInterval(interval);
  }, []);

  if (!data) return <p>Chargement...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Marché Crypto</h2>

      <div>
        <h3>Bitcoin</h3>
        <p>{data.bitcoin.eur} €</p>
        <p
          style={{
            color: data.bitcoin.eur_24h_change > 0 ? "green" : "red",
          }}
        >
          {data.bitcoin.eur_24h_change.toFixed(2)} %
        </p>
      </div>

      <div>
        <h3>Ethereum</h3>
        <p>{data.ethereum.eur} €</p>
        <p
          style={{
            color: data.ethereum.eur_24h_change > 0 ? "green" : "red",
          }}
        >
          {data.ethereum.eur_24h_change.toFixed(2)} %
        </p>
      </div>
    </div>
  );
};

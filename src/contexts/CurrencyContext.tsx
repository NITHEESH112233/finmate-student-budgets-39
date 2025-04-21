
import React, { createContext, useContext, useEffect, useState } from "react";

type CurrencyOption = {
  code: string;
  label: string;
  symbol: string;
};

export const currencies: CurrencyOption[] = [
  { code: "INR", label: "INR (₹)", symbol: "₹" },
  { code: "USD", label: "USD ($)", symbol: "$" },
  { code: "EUR", label: "EUR (€)", symbol: "€" },
  { code: "GBP", label: "GBP (£)", symbol: "£" },
];

type CurrencyContextType = {
  currency: CurrencyOption;
  setCurrency: (currency: CurrencyOption) => void;
};

const defaultCurrency = currencies[0];

const CurrencyContext = createContext<CurrencyContextType>({
  currency: defaultCurrency,
  setCurrency: () => {},
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrencyState] = useState<CurrencyOption>(defaultCurrency);

  useEffect(() => {
    const saved = localStorage.getItem("finmateSettings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const found = currencies.find(cur => cur.label === parsed.currency || cur.code === parsed.currency);
        if (found) setCurrencyState(found);
      } catch {}
    }
  }, []);

  const setCurrency = (currency: CurrencyOption) => {
    setCurrencyState(currency);
    const settings = localStorage.getItem("finmateSettings");
    let toSave = {};
    if (settings) {
      try { toSave = JSON.parse(settings) } catch {}
    }
    localStorage.setItem(
      "finmateSettings",
      JSON.stringify({ ...toSave, currency: currency.label })
    );
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

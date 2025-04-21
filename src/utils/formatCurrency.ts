
import { currencies } from "@/contexts/CurrencyContext";

export function formatCurrency(amount: number, currencyCode: string) {
  const currency = currencies.find(c => c.code === currencyCode);
  const symbol = currency ? currency.symbol : "₹";
  return `${symbol}${amount.toFixed(2)}`;
}

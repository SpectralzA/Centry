"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlaidLink, PlaidLinkOnSuccess, PlaidLinkOptions } from "react-plaid-link";
import { ShieldCheck, ArrowRight, Building2, Lock, Activity } from "lucide-react";

import { Coffee, ShoppingBag, Car, Plane, Utensils, Receipt, HeartPulse } from "lucide-react";

export interface Subscription {
  id: string;
  merchant: string;
  amount: number;
  frequency: string;
  status: "ACTIVE" | "FLAGGED" | "CANCELLED";
  nextBillingDate: string;
}

export interface ExpenseData {
  id: string;
  accountId: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  icon: any;
  color: string;
  bg: string;
  hex: string;
}

export interface BankAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
}

const mapCategory = (plaidCategory: string) => {
  const cat = plaidCategory.toUpperCase();
  if (cat.includes('FOOD') || cat.includes('DINING')) return { category: 'Food & Dining', icon: Utensils, color: 'text-amber-600', bg: 'bg-amber-100', hex: '#D97706' };
  if (cat.includes('TRAVEL') || cat.includes('AIRLINES')) return { category: 'Travel', icon: Plane, color: 'text-blue-600', bg: 'bg-blue-100', hex: '#2563EB' };
  if (cat.includes('TRANSPORTATION') || cat.includes('TAXI') || cat.includes('RIDESHARE')) return { category: 'Transportation', icon: Car, color: 'text-slate-600', bg: 'bg-slate-100', hex: '#475569' };
  if (cat.includes('GROCERY') || cat.includes('SUPERMARKET') || cat.includes('SHOPS') || cat.includes('GENERAL_MERCHANDISE')) return { category: 'Shopping', icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-100', hex: '#059669' };
  if (cat.includes('COFFEE')) return { category: 'Coffee', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-100', hex: '#D97706' };
  if (cat.includes('PERSONAL_CARE')) return { category: 'Personal Care', icon: HeartPulse, color: 'text-pink-600', bg: 'bg-pink-100', hex: '#DB2777' };
  
  const formattedCat = plaidCategory.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  return { category: formattedCat, icon: Receipt, color: 'text-gray-600', bg: 'bg-gray-100', hex: '#4B5563' };
}

interface RealPlaidLinkProps {
  onSuccess: (data: { subscriptions: Subscription[], expenses: ExpenseData[], accounts: BankAccount[] }) => void;
}

export function RealPlaidLink({ onSuccess }: RealPlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isExchanging, setIsExchanging] = useState(false);

  useEffect(() => {
    const createLinkToken = async () => {
      try {
        const response = await fetch('/api/plaid/create-link-token', { method: 'POST' });
        const data = await response.json();
        setLinkToken(data.link_token);
        setIsInitializing(false);
      } catch (error) {
        console.error("Error fetching link token", error);
        setIsInitializing(false);
      }
    };
    createLinkToken();
  }, []);

  const handleOnSuccess: PlaidLinkOnSuccess = useCallback(async (public_token, metadata) => {
    setIsExchanging(true);
    try {
      const response = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token }),
      });
      
      const data = await response.json();
      
      if (data.success && data.access_token) {
        const syncResponse = await fetch('/api/plaid/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: data.access_token })
        });
        
        const syncData = await syncResponse.json();
        
        if (syncData.success) {
          const accounts: BankAccount[] = syncData.accounts.map((acc: any) => ({
            id: acc.account_id,
            name: acc.name,
            type: acc.type === 'depository' ? 'CHECKING' : (acc.type === 'credit' ? 'CREDIT' : 'INVESTMENT'),
            balance: acc.balances.current,
            color: acc.type === 'credit' ? '#94A3B8' : '#2563EB'
          }));

          const expenses: ExpenseData[] = [];
          const subscriptions: Subscription[] = [];

          syncData.transactions.forEach((tx: any) => {
            if (tx.amount > 0) {
              const isSubscription = tx.personal_finance_category?.primary === 'RENT_AND_UTILITIES' || 
                                     tx.personal_finance_category?.primary === 'LOAN_PAYMENTS' ||
                                     ['netflix', 'spotify', 'adobe', 'gym', 'hulu', 'prime', 'apple'].some(k => tx.name.toLowerCase().includes(k));
                                     
              if (isSubscription) {
                subscriptions.push({
                  id: tx.transaction_id,
                  merchant: tx.name,
                  amount: tx.amount,
                  frequency: "Monthly",
                  status: (tx.name.toLowerCase().includes('netflix') || tx.name.toLowerCase().includes('adobe')) ? "FLAGGED" : "ACTIVE",
                  nextBillingDate: new Date(new Date(tx.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });
              } else {
                const mappedCat = mapCategory(tx.personal_finance_category?.primary || 'UNCATEGORIZED');
                expenses.push({
                  id: tx.transaction_id,
                  accountId: tx.account_id,
                  merchant: tx.name,
                  amount: tx.amount,
                  date: tx.date,
                  ...mappedCat
                });
              }
            }
          });

          onSuccess({ subscriptions, expenses, accounts });
        }
      }
    } catch (error) {
      console.error("Error exchanging public token", error);
      setIsExchanging(false);
    }
  }, [onSuccess]);

  const config: PlaidLinkOptions = {
    token: linkToken!,
    onSuccess: handleOnSuccess,
    onExit: (error, metadata) => {
      if (error) {
        alert(`Plaid Error: ${error.error_message} (${error.error_code})`);
        console.error("Plaid Exit Error:", error, metadata);
      }
    }
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 blur transition duration-1000 group-hover:opacity-100" />
      
      <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 flex items-center justify-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <Building2 className="h-6 w-6 text-slate-700" />
          </div>
          <div className="flex space-x-1">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="h-1.5 w-1.5 rounded-full bg-slate-300"
              />
            ))}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        <h3 className="mb-2 text-xl font-bold text-slate-900">Connect Your Bank</h3>
        <p className="mb-8 text-sm text-slate-500">
          We use Plaid to securely connect to your financial institution. We never see or store your banking credentials.
        </p>

        <motion.button
          whileHover={{ scale: (ready && !isExchanging) ? 1.02 : 1 }}
          whileTap={{ scale: (ready && !isExchanging) ? 0.98 : 1 }}
          onClick={() => open()}
          disabled={!ready || isExchanging || isInitializing}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-8 py-4 font-semibold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:bg-slate-800"
        >
          {isExchanging ? (
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 animate-pulse" />
              <span>Securing Connection...</span>
            </div>
          ) : isInitializing ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Initializing...</span>
            </div>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              <span>Continue with Plaid</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

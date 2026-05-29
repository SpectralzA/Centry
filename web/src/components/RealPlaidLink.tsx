"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlaidLink, PlaidLinkOnSuccess, PlaidLinkOptions } from "react-plaid-link";
import { ShieldCheck, ArrowRight, Building2, Lock, Activity } from "lucide-react";

export interface Subscription {
  id: string;
  merchant: string;
  amount: number;
  frequency: string;
  status: "ACTIVE" | "FLAGGED" | "CANCELLED";
  nextBillingDate: string;
}

interface RealPlaidLinkProps {
  onSuccess: (subscriptions: Subscription[]) => void;
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
      
      if (data.success) {
        // In a real scenario, the backend would now fetch /transactions/recurring/get
        // For this MVP transition, we'll populate the dashboard with our mock data 
        // to show the UI after a successful real Plaid Link.
        setTimeout(() => {
          onSuccess([
            { id: "1", merchant: "Netflix", amount: 15.49, frequency: "Monthly", status: "FLAGGED", nextBillingDate: "2026-05-15" },
            { id: "2", merchant: "Spotify Premium", amount: 10.99, frequency: "Monthly", status: "ACTIVE", nextBillingDate: "2026-05-21" },
            { id: "3", merchant: "Planet Fitness", amount: 24.99, frequency: "Monthly", status: "FLAGGED", nextBillingDate: "2026-05-01" },
            { id: "4", merchant: "Adobe Creative Cloud", amount: 54.99, frequency: "Monthly", status: "FLAGGED", nextBillingDate: "2026-05-05" },
            { id: "5", merchant: "Amazon Prime", amount: 139.00, frequency: "Annually", status: "ACTIVE", nextBillingDate: "2026-11-20" }
          ]);
        }, 1000);
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

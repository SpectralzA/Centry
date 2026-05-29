"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";

export interface Subscription {
  id: string;
  merchant: string;
  amount: number;
  frequency: string;
  status: "ACTIVE" | "FLAGGED" | "CANCELLED";
  nextBillingDate: string;
}

interface MockPlaidLinkProps {
  onSuccess: (subscriptions: Subscription[]) => void;
}

export function MockPlaidLink({ onSuccess }: MockPlaidLinkProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const mockSubscriptions: Subscription[] = [
    { id: "1", merchant: "Netflix", amount: 15.49, frequency: "Monthly", status: "ACTIVE", nextBillingDate: "2026-05-20" },
    { id: "2", merchant: "Spotify Premium", amount: 10.99, frequency: "Monthly", status: "ACTIVE", nextBillingDate: "2026-05-22" },
    { id: "3", merchant: "Planet Fitness", amount: 24.99, frequency: "Monthly", status: "FLAGGED", nextBillingDate: "2026-05-28" },
    { id: "4", merchant: "Adobe Creative Cloud", amount: 54.99, frequency: "Monthly", status: "FLAGGED", nextBillingDate: "2026-06-01" },
  ];

  const handleConnect = () => {
    setShowModal(true);
    setIsConnecting(true);
    
    // Simulate Plaid OAuth flow and ML transaction categorization
    setTimeout(() => {
      setIsConnecting(false);
      setTimeout(() => {
        setShowModal(false);
        onSuccess(mockSubscriptions);
      }, 1500);
    }, 2500);
  };

  return (
    <>
      <button
        onClick={handleConnect}
        className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-xl bg-slate-900 px-8 py-4 font-semibold text-white shadow-xl transition-all hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 transition-opacity group-hover:opacity-100" />
        <Building2 className="h-5 w-5" />
        <span>Connect Bank Account</span>
      </button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isConnecting && setShowModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
                  {isConnecting ? (
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                    >
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </motion.div>
                  )}
                </div>
                
                <h3 className="mb-2 text-2xl font-bold text-slate-900">
                  {isConnecting ? "Connecting to your Bank" : "Successfully Connected!"}
                </h3>
                <p className="mb-8 text-slate-500">
                  {isConnecting 
                    ? "Securely syncing your transaction history and analyzing recurring payments..." 
                    : "We've analyzed your last 90 days of transactions."}
                </p>

                <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-medium text-slate-600">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  End-to-End Encrypted
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

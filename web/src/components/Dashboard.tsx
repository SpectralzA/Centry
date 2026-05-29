"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RealPlaidLink, Subscription } from "./RealPlaidLink";
import { AnalyticsView } from "./AnalyticsView";
import { ExpensesView } from "./ExpensesView";
import { AlertCircle, Calendar, CreditCard, DollarSign, ShieldCheck, Mail, CreditCard as CardIcon, CheckCircle2, Activity, PieChart, Receipt } from "lucide-react";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<"audit" | "expenses" | "analytics">("audit");
  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);
  const [cancelingSub, setCancelingSub] = useState<Subscription | null>(null);
  const [cancelStep, setCancelStep] = useState<number>(0);

  const totalSpend = subscriptions?.filter(s => s.status !== "CANCELLED").reduce((acc, sub) => acc + sub.amount, 0) || 0;
  const flaggedCount = subscriptions?.filter((sub) => sub.status === "FLAGGED").length || 0;
  const totalSaved = subscriptions?.filter((sub) => sub.status === "CANCELLED").reduce((acc, sub) => acc + sub.amount, 0) || 0;

  const handleCancel = (sub: Subscription) => {
    setCancelingSub(sub);
    setCancelStep(1);
    
    setTimeout(() => {
      setCancelStep(2);
      setTimeout(() => {
        setCancelStep(3);
        setTimeout(() => {
          setSubscriptions(prev => prev ? prev.map(s => s.id === sub.id ? { ...s, status: "CANCELLED" } : s) : null);
          setCancelingSub(null);
        }, 2000);
      }, 2000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-200 pb-20">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold"
            >
              U
            </motion.div>
          </div>
          <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-200 ring-2 ring-white cursor-pointer hover:ring-blue-200 transition-all">
            <div className="h-full w-full bg-gradient-to-tr from-emerald-400 to-cyan-500" />
          </div>
        </div>
        
        {subscriptions && (
          <div className="mx-auto max-w-5xl px-6 flex gap-6">
            <button
              onClick={() => setActiveTab("audit")}
              className={`pb-4 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === "audit" ? "text-blue-600" : "text-slate-500 hover:text-slate-900"}`}
            >
              <Activity className="h-4 w-4" />
              Subscriptions
              {activeTab === "audit" && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`pb-4 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === "expenses" ? "text-blue-600" : "text-slate-500 hover:text-slate-900"}`}
            >
              <Receipt className="h-4 w-4" />
              Expenses
              {activeTab === "expenses" && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-4 text-sm font-medium transition-colors relative flex items-center gap-2 ${activeTab === "analytics" ? "text-blue-600" : "text-slate-500 hover:text-slate-900"}`}
            >
              <PieChart className="h-4 w-4" />
              Analytics
              {activeTab === "analytics" && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <AnimatePresence mode="wait">
          {!subscriptions ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex min-h-[60vh] flex-col items-center justify-center text-center"
            >
              <RealPlaidLink onSuccess={setSubscriptions} />
            </motion.div>
          ) : activeTab === "audit" ? (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm font-medium uppercase tracking-wider">Active Spend</span>
                  </div>
                  <div className="text-4xl font-bold">${totalSpend.toFixed(2)}</div>
                  <p className="mt-1 text-sm text-slate-400">per month</p>
                </motion.div>

                <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-2 flex items-center gap-2 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium uppercase tracking-wider">Flagged for Review</span>
                  </div>
                  <div className="text-4xl font-bold text-orange-700">{flaggedCount}</div>
                  <p className="mt-1 text-sm text-orange-600/80">0 hours used in 30 days</p>
                </motion.div>

                <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-2 flex items-center gap-2 text-emerald-600">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-sm font-medium uppercase tracking-wider">Total Saved</span>
                  </div>
                  <div className="text-4xl font-bold text-emerald-700">${totalSaved.toFixed(2)}</div>
                  <p className="mt-1 text-sm text-emerald-600/80">annualized: ${(totalSaved * 12).toFixed(2)}</p>
                </motion.div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900">Identified Subscriptions</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {subscriptions.map((sub, i) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.05, type: "spring", bounce: 0.2 }}
                        key={sub.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 transition-colors ${sub.status === 'CANCELLED' ? 'bg-slate-50/50 opacity-60' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-4 mb-4 sm:mb-0">
                          <motion.div 
                            whileHover={{ rotate: sub.status === 'FLAGGED' ? [0, -10, 10, -10, 0] : 0 }}
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                            sub.status === "FLAGGED" ? "bg-orange-100 text-orange-600" : 
                            sub.status === "CANCELLED" ? "bg-slate-200 text-slate-500" : 
                            "bg-blue-100 text-blue-600"
                          }`}>
                            {sub.status === "FLAGGED" ? <AlertCircle className="h-6 w-6" /> : 
                             sub.status === "CANCELLED" ? <ShieldCheck className="h-6 w-6" /> : 
                             <CreditCard className="h-6 w-6" />}
                          </motion.div>
                          <div>
                            <h4 className={`font-semibold text-lg ${sub.status === 'CANCELLED' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                              {sub.merchant}
                            </h4>
                            <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                              {sub.status === 'CANCELLED' ? (
                                <span className="text-emerald-600 font-medium">Successfully Cancelled</span>
                              ) : (
                                <>
                                  <Calendar className="h-3 w-3" />
                                  <span>Next bill: {new Date(sub.nextBillingDate).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                          <div className="text-left sm:text-right">
                            <div className={`text-lg font-bold ${sub.status === 'CANCELLED' ? 'text-slate-400' : 'text-slate-900'}`}>
                              ${sub.amount.toFixed(2)}
                            </div>
                            <div className="text-sm text-slate-500">{sub.frequency}</div>
                          </div>
                          
                          {sub.status === 'FLAGGED' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCancel(sub)}
                              className="rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500"
                            >
                              1-Click Cancel
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : activeTab === "expenses" ? (
            <ExpensesView key="expenses" />
          ) : (
            <AnalyticsView key="analytics" subscriptions={subscriptions || []} />
          )}
        </AnimatePresence>
      </main>

      {/* Cancellation Modal Overlay */}
      <AnimatePresence>
        {cancelingSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="bg-slate-50 p-6 text-center border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">Cancelling {cancelingSub.merchant}</h3>
                <p className="text-slate-500 text-sm mt-1">Automated AI Resolution</p>
              </div>
              
              <div className="p-8 space-y-8">
                {/* Step 1 */}
                <div className="flex items-center gap-4">
                  <motion.div 
                    initial={false}
                    animate={{ scale: cancelStep >= 1 ? [1, 1.2, 1] : 1 }}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${cancelStep >= 1 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                  >
                    {cancelStep > 1 ? <CheckCircle2 className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                  </motion.div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${cancelStep >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>Drafting Cancellation Request</h4>
                    <p className="text-xs text-slate-500">Generating compliance email template</p>
                  </div>
                  {cancelStep === 1 && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />}
                </div>

                {/* Step 2 */}
                <div className="flex items-center gap-4">
                  <motion.div 
                    initial={false}
                    animate={{ scale: cancelStep >= 2 ? [1, 1.2, 1] : 1 }}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${cancelStep >= 2 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                  >
                    {cancelStep > 2 ? <CheckCircle2 className="h-5 w-5" /> : <CardIcon className="h-5 w-5" />}
                  </motion.div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${cancelStep >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>Freezing Virtual Card</h4>
                    <p className="text-xs text-slate-500">Blocking future charges immediately</p>
                  </div>
                  {cancelStep === 2 && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />}
                </div>

                {/* Step 3 */}
                <div className="flex items-center gap-4">
                  <motion.div 
                    initial={false}
                    animate={{ scale: cancelStep >= 3 ? [1, 1.2, 1] : 1 }}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${cancelStep >= 3 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                  >
                    <ShieldCheck className="h-5 w-5" />
                  </motion.div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${cancelStep >= 3 ? 'text-emerald-700' : 'text-slate-400'}`}>Successfully Unsubscribed</h4>
                    <p className="text-xs text-slate-500">Saved ${cancelingSub.amount}/mo</p>
                  </div>
                </div>
              </div>

              {/* Progress bar bottom */}
              <div className="h-1.5 w-full bg-slate-100">
                <motion.div 
                  className="h-full bg-emerald-500"
                  initial={{ width: "0%" }}
                  animate={{ width: cancelStep === 1 ? "33%" : cancelStep === 2 ? "66%" : "100%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

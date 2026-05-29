"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart as PieChartIcon, ChevronDown, Receipt } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ExpenseData } from "./RealPlaidLink";

export function ExpensesView({ expenses = [] }: { expenses?: ExpenseData[] }) {
  // Dynamically extract unique months from expenses
  const months = useMemo(() => {
    if (!expenses.length) return [{ label: "Current Month", value: "all" }];
    
    const uniqueMonths = new Set<string>();
    expenses.forEach(e => {
      // e.date is YYYY-MM-DD, extract YYYY-MM
      const ym = e.date.substring(0, 7);
      uniqueMonths.add(ym);
    });
    
    return Array.from(uniqueMonths)
      .sort((a, b) => b.localeCompare(a)) // Sort descending
      .map(ym => {
        const [year, month] = ym.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          value: ym
        };
      });
  }, [expenses]);

  const [selectedMonth, setSelectedMonth] = useState(months[0]?.value || "all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredExpenses = expenses.filter(e => selectedMonth === "all" || e.date.startsWith(selectedMonth));
  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Aggregate category spend for the selected month
  const categoryTotals = filteredExpenses.reduce((acc, curr) => {
    if (!acc[curr.category]) {
      acc[curr.category] = { name: curr.category, value: 0, color: curr.hex };
    }
    acc[curr.category].value += curr.amount;
    return acc;
  }, {} as Record<string, { name: string, value: number, color: string }>);

  const categoryData = Object.values(categoryTotals).sort((a, b) => b.value - a.value);

  const currentMonthLabel = months.find(m => m.value === selectedMonth)?.label || "Current Month";

  const handleNextMonth = () => {
    const currentIndex = months.findIndex(m => m.value === selectedMonth);
    if (currentIndex < months.length - 1) {
      setSelectedMonth(months[currentIndex + 1].value);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Recent Expenses</h2>
          <p className="text-slate-500">Track your variable daily spending.</p>
        </div>
        
        {/* Month Selector */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm w-full sm:w-auto justify-between sm:justify-start"
          >
            {currentMonthLabel}
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
              >
                {months.map(month => (
                  <button
                    key={month.value}
                    onClick={() => {
                      setSelectedMonth(month.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${selectedMonth === month.value ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {month.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Category Breakdown Pie Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-purple-500" />
              Category Breakdown
            </h3>
            <p className="text-sm text-slate-500">Where your money went in {currentMonthLabel?.split(' ')[0]}.</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
            {categoryData.length > 0 ? (
              <>
                <div className="h-[200px] w-full z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={categoryData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value" 
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        wrapperStyle={{ zIndex: 100 }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Spent"]} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2 z-0">
                  <span className="text-xl font-bold text-slate-900">${totalExpenses.toFixed(0)}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total</span>
                </div>
              </>
            ) : (
              <div className="text-slate-400 text-sm text-center">No expenses recorded for this month.</div>
            )}
          </div>

          {/* Category Legend */}
          <div className="mt-6 flex flex-col gap-3">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">${cat.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-500" />
              Transactions
            </h3>
            <span className="text-sm font-medium text-slate-500">{filteredExpenses.length} items</span>
          </div>
          
          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
            {filteredExpenses.map((expense, i) => {
              const Icon = expense.icon;
              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, type: "spring", bounce: 0.2 }}
                  className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${expense.bg} ${expense.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-lg">{expense.merchant}</h4>
                      <p className="text-sm text-slate-500">{expense.category}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">
                      ${expense.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {filteredExpenses.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                No expenses found for {currentMonthLabel}.
              </div>
            )}
          </div>
          
          {/* Bottom "Load Previous" button for smoother UX */}
          {months.findIndex(m => m.value === selectedMonth) < months.length - 1 && (
            <div className="border-t border-slate-100 bg-slate-50/50 p-4 text-center">
              <button 
                onClick={handleNextMonth}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                See previous month
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

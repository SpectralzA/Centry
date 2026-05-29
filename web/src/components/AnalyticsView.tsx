import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, ScatterChart, Scatter, ZAxis } from "recharts";
import { TrendingDown, Landmark, CreditCard, Calendar, ArrowUpRight, DollarSign, PieChart as PieChartIcon, ShieldCheck, AlertCircle, EyeOff, Activity } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Subscription, ExpenseData, BankAccount } from "./RealPlaidLink";

function SortableItem(props: { id: string, children: React.ReactNode, colSpan?: string, isEditMode: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`${props.colSpan || 'col-span-1'} ${isDragging ? 'opacity-50' : 'opacity-100'} relative`}
    >
      {props.isEditMode && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute -top-2 -left-2 z-20 flex h-8 w-8 cursor-grab items-center justify-center rounded-full bg-slate-800 text-white shadow-lg animate-pulse"
        >
          <Activity className="h-4 w-4" />
        </div>
      )}
      <div className={`h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col ${props.isEditMode ? 'animate-wiggle cursor-grab' : ''}`}>
        {props.children}
      </div>
    </div>
  );
}

export function AnalyticsView({ subscriptions = [], expenses = [], accounts = [] }: { subscriptions?: Subscription[], expenses?: ExpenseData[], accounts?: BankAccount[] }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState([
    { id: '1', type: 'TOTAL_SPEND', colSpan: 'lg:col-span-2' },
    { id: '2', type: 'ACCOUNT_BALANCES', colSpan: 'lg:col-span-1' },
    { id: '3', type: 'TOP_EXPENSIVE', colSpan: 'lg:col-span-1' },
    { id: '4', type: 'UPCOMING_RENEWALS', colSpan: 'lg:col-span-1' },
    { id: '5', type: 'SAVINGS_ROI', colSpan: 'lg:col-span-1' },
    { id: '6', type: 'PHANTOM_SUBS', colSpan: 'lg:col-span-1' },
    { id: '7', type: 'PROJECTED_ANNUAL', colSpan: 'lg:col-span-1' },
    { id: '8', type: 'CATEGORY_SPEND', colSpan: 'lg:col-span-1' },
    { id: '9', type: 'RECENT_LARGE', colSpan: 'lg:col-span-1' },
    { id: '10', type: 'USAGE_MATRIX', colSpan: 'lg:col-span-2' },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Dynamic Data Calculations
  const activeSubs = subscriptions.filter(s => s.status !== "CANCELLED");
  const cancelledSubs = subscriptions.filter(s => s.status === "CANCELLED");

  const topExpensiveSubs = [...activeSubs]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map(sub => ({ name: sub.merchant, cost: sub.amount }));

  const upcomingRenewals = [...activeSubs]
    .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime())
    .slice(0, 3)
    .map(sub => ({
      n: sub.merchant,
      d: new Date(sub.nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      a: sub.amount
    }));

  const phantomSubs = activeSubs
    .filter(sub => sub.status === "FLAGGED")
    .map(sub => ({ n: sub.merchant, a: sub.amount }));

  const projectedAnnual = activeSubs.reduce((acc, sub) => {
    return acc + (sub.frequency === "Monthly" ? sub.amount * 12 : sub.amount);
  }, 0);

  const monthlySavings = cancelledSubs.reduce((acc, sub) => acc + (sub.frequency === "Monthly" ? sub.amount : sub.amount / 12), 0);
  const annualizedSavings = monthlySavings * 12;

  const usageCostData = activeSubs.map(sub => ({
    x: Math.floor(Math.random() * 30), // Simulated usage hours for MVP matrix
    y: sub.amount,
    name: sub.merchant,
    fill: sub.status === "FLAGGED" ? "#EF4444" : "#10B981"
  }));

  const accountBreakdown = accounts.map((acc, i) => ({
    name: acc.name,
    value: acc.balance,
    color: acc.color || (i % 2 === 0 ? "#3B82F6" : "#8B5CF6"),
    type: acc.type
  }));

  const totalAccountBalance = accountBreakdown.reduce((acc, curr) => acc + curr.value, 0);

  const categoryTotals = expenses.reduce((acc, curr) => {
    if (!acc[curr.category]) {
      acc[curr.category] = { name: curr.category, value: 0, color: curr.hex };
    }
    acc[curr.category].value += curr.amount;
    return acc;
  }, {} as Record<string, { name: string, value: number, color: string }>);
  
  const categorySpend = Object.values(categoryTotals).sort((a, b) => b.value - a.value).slice(0, 6); // Top 6 categories

  const recentLargeExpenses = [...expenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map(exp => ({
      n: exp.merchant,
      d: new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      a: exp.amount
    }));

  const totalSpendingTrend = useMemo(() => {
    const monthsData: Record<string, { month: string, subscriptions: number, expenses: number }> = {};
    
    expenses.forEach(exp => {
      const ym = exp.date.substring(0, 7);
      if (!monthsData[ym]) monthsData[ym] = { month: ym, subscriptions: 0, expenses: 0 };
      monthsData[ym].expenses += exp.amount;
    });

    // Assume active subscriptions apply to every past month seen in expenses for trend visualization
    Object.keys(monthsData).forEach(ym => {
      monthsData[ym].subscriptions = activeSubs.reduce((acc, sub) => acc + sub.amount, 0);
    });

    return Object.values(monthsData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(data => ({
        ...data,
        month: new Date(data.month + "-01").toLocaleDateString('en-US', { month: 'short' })
      }));
  }, [expenses, activeSubs]);

  const renderWidgetContent = (type: string) => {
    switch(type) {
      case 'TOTAL_SPEND':
        return (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-emerald-500" /> Total Spending History
                </h3>
                <p className="text-sm text-slate-500">Subscriptions vs. Variable Expenses over time.</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={totalSpendingTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/></linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                  <YAxis width={80} axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#0F172A', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="expenses" stroke="#3B82F6" fill="url(#colorExp)" name="Regular Expenses" />
                  <Area type="monotone" dataKey="subscriptions" stroke="#8B5CF6" fill="url(#colorSubs)" name="Fixed Subscriptions" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        );
      
      case 'ACCOUNT_BALANCES':
        return (
          <>
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Landmark className="h-5 w-5 text-blue-500" /> Account Breakdown</h3>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2 z-0">
                <span className="text-xl font-bold text-slate-900">${(totalAccountBalance / 1000).toFixed(1)}k</span><span className="text-[10px] text-slate-500 uppercase tracking-wider">Total</span>
              </div>
              <div className="h-[180px] w-full z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={accountBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">{accountBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip wrapperStyle={{ zIndex: 100 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [`$${value}`, "Balance"]} /></PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-2 overflow-y-auto max-h-[100px]">
              {accountBreakdown.map((acc) => (
                <div key={acc.name} className="flex items-center justify-between text-sm shrink-0">
                  <div className="flex items-center gap-2 truncate pr-2"><div className="h-2 w-2 rounded-full shrink-0" style={{backgroundColor: acc.color}}/><span className="text-slate-700 truncate">{acc.name}</span></div>
                  <span className="font-semibold text-slate-900 shrink-0">${acc.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </>
        );

      case 'UPCOMING_RENEWALS':
        return (
          <>
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Calendar className="h-5 w-5 text-indigo-500" /> Upcoming Renewals</h3>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              {upcomingRenewals.map(sub => (
                <div key={sub.n} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="truncate pr-2">
                    <p className="font-semibold text-slate-900 truncate">{sub.n}</p>
                    <p className="text-xs text-slate-500">{sub.d}</p>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">${sub.a.toFixed(2)}</span>
                </div>
              ))}
              {upcomingRenewals.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-4">No upcoming renewals found.</div>
              )}
            </div>
          </>
        );

      case 'TOP_EXPENSIVE':
        return (
          <>
             <div className="mb-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><ArrowUpRight className="h-5 w-5 text-rose-500" /> Top Expensive Subs</h3>
            </div>
            <div className="h-[200px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topExpensiveSubs} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748B'}} width={80} />
                  <Tooltip cursor={{fill: '#F1F5F9'}} formatter={(val: any) => `$${val}`} />
                  <Bar dataKey="cost" fill="#F43F5E" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        );

      case 'SAVINGS_ROI':
        return (
          <div className="flex flex-col h-full justify-center items-center text-center">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Savings ROI</h3>
            <span className="text-5xl font-black text-emerald-500">${monthlySavings.toFixed(2)}</span>
            <p className="text-sm text-emerald-600/80 mt-2 font-medium">Annualized projection: ${annualizedSavings.toFixed(0)}</p>
          </div>
        );

      case 'PROJECTED_ANNUAL':
        return (
          <div className="flex flex-col h-full justify-center items-center text-center">
            <div className="h-16 w-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Projected Annual Run-Rate</h3>
            <span className="text-4xl font-black text-slate-900">${projectedAnnual.toFixed(2)}</span>
            <p className="text-sm text-slate-500 mt-2">Based on current active subscriptions</p>
          </div>
        );

      case 'PHANTOM_SUBS':
        return (
          <div className="flex flex-col h-full justify-between bg-rose-50 border border-rose-100 -m-6 p-6 rounded-2xl">
            <div>
              <h3 className="font-semibold text-rose-900 flex items-center gap-2"><EyeOff className="h-5 w-5 text-rose-600" /> Phantom Subscriptions</h3>
              <p className="text-sm text-rose-700 mt-2">You are paying for these but haven't used them in 30+ days.</p>
            </div>
            <div className="space-y-3 mt-4 overflow-y-auto max-h-[150px] pr-2">
               {phantomSubs.map(sub => (
                 <div key={sub.n} className="flex justify-between items-center bg-white p-3 rounded-lg border border-rose-100 shadow-sm shrink-0">
                   <span className="font-medium text-slate-900 truncate pr-2">{sub.n}</span>
                   <span className="font-bold text-rose-600 shrink-0">${sub.a.toFixed(2)}</span>
                 </div>
               ))}
               {phantomSubs.length === 0 && (
                 <div className="text-sm text-rose-700 font-medium py-2">No phantom subscriptions detected!</div>
               )}
            </div>
          </div>
        );

      case 'CATEGORY_SPEND':
        return (
          <>
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-cyan-500" /> Top Category Spend</h3>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-[180px] w-full z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={categorySpend} cx="50%" cy="50%" outerRadius={70} dataKey="value" stroke="#fff" strokeWidth={2}>{categorySpend.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip wrapperStyle={{ zIndex: 100 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Spend"]} /></PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        );

      case 'RECENT_LARGE':
        return (
           <>
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><AlertCircle className="h-5 w-5 text-amber-500" /> Recent Large Expenses</h3>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              {recentLargeExpenses.map(sub => (
                <div key={sub.n} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="truncate pr-2">
                    <p className="font-semibold text-slate-900 truncate">{sub.n}</p>
                    <p className="text-xs text-slate-500">{sub.d}</p>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">${sub.a.toFixed(2)}</span>
                </div>
              ))}
              {recentLargeExpenses.length === 0 && (
                 <div className="text-sm text-slate-500 text-center py-4">No recent large expenses found.</div>
              )}
            </div>
          </>
        );

      case 'USAGE_MATRIX':
        return (
          <>
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" /> Usage vs. Cost Matrix
              </h3>
              <p className="text-sm text-slate-500">Evaluates the 'value' of your subscriptions (Usage Hours vs. Monthly Cost).</p>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis type="number" dataKey="x" name="Usage (Hours)" unit="h" tick={{fill: '#64748B'}} axisLine={false} tickLine={false} />
                  <YAxis type="number" dataKey="y" name="Cost" unit="$" tick={{fill: '#64748B'}} axisLine={false} tickLine={false} />
                  <ZAxis type="number" range={[100, 100]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Scatter name="Subscriptions" data={usageCostData}>
                    {usageCostData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </>
        );

      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-10"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Analytics Dashboard</h2>
          <p className="text-slate-500">A customizable view of your financial health.</p>
        </div>
        <button 
          onClick={() => setIsEditMode(!isEditMode)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isEditMode ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          {isEditMode ? 'Done Editing' : 'Edit Widgets'}
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets} strategy={rectSortingStrategy}>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(300px,auto)]">
            {widgets.map((widget) => (
              <SortableItem key={widget.id} id={widget.id} colSpan={widget.colSpan} isEditMode={isEditMode}>
                {renderWidgetContent(widget.type)}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Global Style for Jiggle Animation in Edit Mode */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wiggle {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-1deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(1deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.3s linear infinite;
        }
      `}} />
    </motion.div>
  );
}

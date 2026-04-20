/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Plus, LayoutGrid, List, TrendingUp, PieChart, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Goal } from './types';
import { storage } from './lib/storage';
import { GoalCard } from './components/GoalCard';
import { GoalModal } from './components/GoalModal';
import { ValueUpdateModal } from './components/ValueUpdateModal';

export default function App() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setGoals(storage.getGoals());
  }, []);

  const stats = useMemo(() => {
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    const completedCount = goals.filter(g => g.currentAmount >= g.targetAmount).length;

    return { totalTarget, totalCurrent, overallProgress, completedCount };
  }, [goals]);

  const handleSaveGoal = (goalData: Omit<Goal, 'id' | 'createdAt'>, id?: string) => {
    let updatedGoals: Goal[];
    if (id) {
      updatedGoals = goals.map(g => (g.id === id ? { ...g, ...goalData } : g));
    } else {
      const newGoal: Goal = {
        ...goalData,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
      };
      updatedGoals = [...goals, newGoal];
    }
    setGoals(updatedGoals);
    storage.saveGoals(updatedGoals);
    setEditingGoal(null);
  };

  const handleUpdateAmount = (id: string, amount: number) => {
    const updatedGoals = goals.map(g => 
      g.id === id ? { ...g, currentAmount: Math.max(0, g.currentAmount + amount) } : g
    );
    setGoals(updatedGoals);
    storage.saveGoals(updatedGoals);
  };

  const handleDeleteGoal = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      const updatedGoals = goals.filter(g => g.id !== id);
      setGoals(updatedGoals);
      storage.saveGoals(updatedGoals);
    }
  };

  const openNewGoalModal = () => {
    setEditingGoal(null);
    setIsGoalModalOpen(true);
  };

  const openEditGoalModal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
  };

  const openValueModal = (goal: Goal) => {
    setActiveGoal(goal);
    setIsValueModalOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-bottom border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-gray-200">
              <TrendingUp size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">GoalFlow</h1>
          </div>
          <button
            onClick={openNewGoalModal}
            className="px-5 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-lg shadow-gray-100 flex items-center gap-2"
          >
            <Plus size={18} />
            Nova Meta
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-card p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <PieChart size={20} />
              </div>
              <span className="text-xs font-mono text-gray-400 font-bold">TOTAL ACUMULADO</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">{formatCurrency(stats.totalCurrent)}</h2>
              <p className="text-sm text-gray-500 font-medium">De {formatCurrency(stats.totalTarget)} planejados</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-brand-card p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <Activity size={20} />
              </div>
              <span className="text-xs font-mono text-gray-400 font-bold">PROGRESSO GERAL</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <h2 className="text-3xl font-bold tracking-tight">{stats.overallProgress.toFixed(1)}%</h2>
                <span className="text-sm font-semibold text-green-600">{stats.completedCount} metas concluídas</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.overallProgress}%` }}
                  className="h-full bg-green-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900 p-6 rounded-3xl shadow-xl space-y-4 text-white relative overflow-hidden"
          >
            <div className="relative z-10 space-y-4 text-balance">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp size={20} />
                </div>
                <span className="text-xs font-mono text-white/40 font-bold uppercase tracking-wider">Insight do Dia</span>
              </div>
              <p className="text-lg font-medium leading-tight">
                {stats.totalCurrent === 0 
                  ? "Comece hoje a poupar para seus sonhos. Cada centavo conta!"
                  : stats.overallProgress > 50 
                    ? "Você já passou da metade! Continue firme na sua jornada."
                    : "Mantenha o foco. Suas metas estão cada vez mais próximas."}
              </p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
          </motion.div>
        </div>

        {/* Goals Grid Header */}
        <div className="flex items-center justify-between mt-12">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Suas Metas</h2>
            <p className="text-gray-500 text-sm font-medium">{goals.length} objetivos definidos</p>
          </div>
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Goals Content */}
        {goals.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center px-4"
          >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-300 mb-6">
              <Activity size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma meta criada</h3>
            <p className="text-gray-500 max-w-xs mb-8 font-medium">
              O primeiro passo para realizar um sonho é tirá-lo do papel. Que tal começar agora?
            </p>
            <button
              onClick={openNewGoalModal}
              className="px-8 py-3 bg-brand-primary text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
            >
              Criar minha primeira meta
            </button>
          </motion.div>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            <AnimatePresence mode="popLayout">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onAddValue={() => openValueModal(goal)}
                  onEdit={() => openEditGoalModal(goal)}
                  onDelete={() => handleDeleteGoal(goal.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
        initialGoal={editingGoal}
      />

      <ValueUpdateModal
        isOpen={isValueModalOpen}
        onClose={() => setIsValueModalOpen(false)}
        onUpdate={handleUpdateAmount}
        goal={activeGoal}
      />
    </div>
  );
}

function Target({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

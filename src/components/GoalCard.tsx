/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Trash2, Plus, MoreHorizontal } from 'lucide-react';
import { Goal } from '../types';

interface GoalCardProps {
  goal: Goal;
  onAddValue: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onAddValue, onEdit, onDelete }) => {
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const isCompleted = progress === 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-brand-card p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isCompleted ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-lg leading-tight">{goal.name}</h3>
            <span className="text-xs font-mono text-gray-400 tracking-wider uppercase">{goal.category}</span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEdit}
            className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>
          <button 
            onClick={onDelete}
            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Progresso</p>
            <p className="text-2xl font-semibold tracking-tight">
              {formatCurrency(goal.currentAmount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Meta</p>
            <p className="text-sm font-medium text-gray-800">{formatCurrency(goal.targetAmount)}</p>
          </div>
        </div>

        <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`absolute inset-0 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
          <span>{progress.toFixed(1)}% completo</span>
          {goal.deadline && (
            <span>Até {new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          onClick={onAddValue}
          className="flex-1 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Adicionar Valor
        </button>
      </div>
    </motion.div>
  );
}

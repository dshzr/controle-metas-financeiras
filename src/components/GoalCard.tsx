/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Trash2, Plus, MoreHorizontal, Calendar, Tag, ChevronDown } from 'lucide-react';
import { Goal } from '../types';

interface GoalCardProps {
  goal: Goal;
  onAddValue: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onAddValue, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
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
      onClick={() => setIsExpanded(!isExpanded)}
      className={`group relative bg-brand-card p-6 rounded-3xl border ${isExpanded ? 'border-brand-primary/20 shadow-md ring-4 ring-brand-primary/5' : 'border-gray-100 shadow-sm'} hover:shadow-md transition-all cursor-pointer overflow-hidden`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${isCompleted ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-lg leading-tight text-gray-900">{goal.name}</h3>
            <span className={`text-xs font-semibold ${isCompleted ? 'text-green-500' : 'text-blue-500'}`}>
              {progress.toFixed(1)}% Completo
            </span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="p-1 text-gray-400"
        >
          <ChevronDown size={20} />
        </motion.div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Progresso atual</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900">
              {formatCurrency(goal.currentAmount)}
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-sm text-gray-500">Meta final</p>
            <p className="text-sm font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">{formatCurrency(goal.targetAmount)}</p>
          </div>
        </div>

        <div className="relative h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`absolute inset-0 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-brand-primary'}`}
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-gray-100 space-y-5">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <Tag size={14} />
                  <span className="font-medium capitalize">{goal.category}</span>
                </div>
                {goal.deadline && (
                  <div className="flex items-center gap-1.5 text-sm w-fit text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <Calendar size={14} />
                    <span className="font-medium">{new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onAddValue(); }}
                  className="flex-1 py-3 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 transform active:scale-95 shadow-md shadow-brand-primary/20"
                >
                  <Plus size={16} />
                  Adicionar Valor
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-3 text-gray-500 bg-gray-50 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-medium border border-gray-100"
                    title="Editar meta"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-3 text-gray-500 bg-gray-50 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium border border-gray-100"
                    title="Excluir meta"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

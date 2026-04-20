/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Calendar, Wallet } from 'lucide-react';
import { Goal, Category } from '../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Omit<Goal, 'id' | 'createdAt'>, id?: string) => void;
  initialGoal?: Goal | null;
}

export function GoalModal({ isOpen, onClose, onSave, initialGoal }: GoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState<Category>('purchase');

  useEffect(() => {
    if (initialGoal) {
      setName(initialGoal.name);
      setTargetAmount(initialGoal.targetAmount.toString());
      setDeadline(initialGoal.deadline || '');
      setCategory(initialGoal.category);
    } else {
      setName('');
      setTargetAmount('');
      setDeadline('');
      setCategory('purchase');
    }
  }, [initialGoal, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;

    onSave({
      name,
      targetAmount: Number(targetAmount),
      currentAmount: initialGoal?.currentAmount || 0,
      deadline: deadline || undefined,
      category,
    }, initialGoal?.id);

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                {initialGoal ? 'Editar Meta' : 'Nova Meta'}
              </h2>
              <p className="text-gray-500">
                {initialGoal ? 'Atualize os detalhes do seu objetivo.' : 'Defina seu próximo objetivo financeiro.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Target size={16} /> O que você quer conquistar?
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Ex: MacBook Pro, Reserva de Emergência"
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Wallet size={16} /> Valor Alvo
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar size={16} /> Prazo (Opcional)
                  </label>
                  <input
                    type="date"
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Categoria</label>
                <div className="flex flex-wrap gap-2">
                  {(['purchase', 'investment', 'emergency', 'leisure', 'other'] as Category[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        category === cat
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {cat === 'purchase' && 'Compra'}
                      {cat === 'investment' && 'Investimento'}
                      {cat === 'emergency' && 'Emergência'}
                      {cat === 'leisure' && 'Lazer'}
                      {cat === 'other' && 'Outro'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all transform active:scale-95 shadow-xl shadow-gray-200 mt-4"
              >
                {initialGoal ? 'Salvar Alterações' : 'Criar Meta'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

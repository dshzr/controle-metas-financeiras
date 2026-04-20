/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, DollarSign } from 'lucide-react';
import { Goal } from '../types';

interface ValueUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, amount: number) => void;
  goal: Goal | null;
}

export function ValueUpdateModal({ isOpen, onClose, onUpdate, goal }: ValueUpdateModalProps) {
  const [value, setValue] = useState('');
  const [mode, setMode] = useState<'add' | 'subtract'>('add');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value || !goal) return;

    const amount = mode === 'add' ? Number(value) : -Number(value);
    onUpdate(goal.id, amount);
    setValue('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && goal && (
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
            className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DollarSign size={32} />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Atualizar Valor</h2>
              <p className="text-gray-500 text-sm mt-1">{goal.name}</p>
            </div>

            <div className="flex p-1 bg-gray-100 rounded-2xl mb-6">
              <button
                onClick={() => setMode('add')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  mode === 'add' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
                }`}
              >
                <Plus size={16} /> Adicionar
              </button>
              <button
                onClick={() => setMode('subtract')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  mode === 'subtract' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'
                }`}
              >
                <Minus size={16} /> Subtrair
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">R$</span>
                <input
                  autoFocus
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 text-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all transform active:scale-95 shadow-xl ${
                  mode === 'add' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-red-600 text-white shadow-red-200'
                }`}
              >
                Confirmar
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

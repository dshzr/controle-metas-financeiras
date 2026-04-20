import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Receipt, Search, CheckCircle2, Circle, Clock, Trash2, Edit2, RotateCw } from 'lucide-react';
import { Bill } from '../types';
import { api } from '../lib/api';

export const Bills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  // Form states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const data = await api.getBills();
      setBills(data);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !dueDate) return;

    try {
      const billData = {
        description,
        amount: parseFloat(amount),
        dueDate,
        isRecurring,
        status: editingBill?.status || 'pending'
      };

      if (editingBill) {
        const updated = await api.updateBill(editingBill.id, billData);
        setBills(bills.map(b => b.id === updated.id ? updated : b));
      } else {
        const created = await api.createBill(billData);
        setBills([...bills, created]);
      }
      closeModal();
    } catch (err) {
      alert('Erro ao salvar conta');
    }
  };

  const toggleStatus = async (bill: Bill) => {
    try {
      const newStatus = bill.status === 'pending' ? 'paid' : 'pending';
      const updated = await api.updateBill(bill.id, {
        description: bill.description,
        amount: bill.amount,
        dueDate: bill.dueDate,
        isRecurring: bill.isRecurring,
        status: newStatus
      });
      setBills(bills.map(b => b.id === updated.id ? updated : b));
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta conta?')) {
      try {
        await api.deleteBill(id);
        setBills(bills.filter(b => b.id !== id));
      } catch (err) {
        alert('Erro ao excluir conta');
      }
    }
  };

  const openModal = (bill?: Bill) => {
    if (bill) {
      setEditingBill(bill);
      setDescription(bill.description);
      setAmount(bill.amount.toString());
      setDueDate(bill.dueDate); // now guarantees to be YYYY-MM-DD
      setIsRecurring(bill.isRecurring);
    } else {
      setEditingBill(null);
      setDescription('');
      setAmount('');
      const localDate = new Date();
      setDueDate(localDate.toLocaleDateString("en-CA")); // Generates generic local YYYY-MM-DD independent of UTC
      setIsRecurring(false);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredBills = bills.filter(b => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const totalValue = filteredBills.reduce((acc, curr) => acc + curr.amount, 0);

  if (loading) return <div className="flex h-full items-center justify-center">Carregando...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Contas a Pagar</h1>
          <p className="text-gray-500 font-medium mt-1">Gerencie seus compromissos financeiros</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-5 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2 w-fit"
        >
          <Plus size={18} />
          Nova Conta
        </button>
      </div>

      {/* Summary / Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button
             onClick={() => setFilter('all')}
             className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Todas
          </button>
          <button
             onClick={() => setFilter('pending')}
             className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pendentes
          </button>
          <button
             onClick={() => setFilter('paid')}
             className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'paid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pagas
          </button>
        </div>

        <div className="flex items-center gap-3 px-4">
          <span className="text-sm font-medium text-gray-500">Total listado:</span>
          <span className="text-xl font-bold text-gray-900">{formatCurrency(totalValue)}</span>
        </div>
      </div>

      {/* Bills List */}
      <div className="space-y-4">
        {filteredBills.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border-2 border-dashed border-gray-200">
            <Receipt className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">Nenhuma conta encontrada</h3>
            <p className="text-gray-500">Você não tem contas nesta categoria.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredBills.map(bill => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={bill.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center gap-4 ${
                  bill.status === 'paid' ? 'bg-gray-50 border-gray-100 opacity-70' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Status Toggle */}
                <button 
                  onClick={() => toggleStatus(bill)}
                  className={`shrink-0 transition-colors ${bill.status === 'paid' ? 'text-green-500' : 'text-gray-300 hover:text-brand-primary'}`}
                >
                  {bill.status === 'paid' ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                </button>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-lg font-bold ${bill.status === 'paid' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {bill.description}
                    </h3>
                    {bill.isRecurring && (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        <RotateCw size={10} /> Recorrente
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm font-medium text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      Vence em: {new Date(bill.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Value & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                  <span className={`text-xl font-bold ${bill.status === 'paid' ? 'text-gray-500' : 'text-brand-primary'}`}>
                    {formatCurrency(bill.amount)}
                  </span>
                  
                  <div className="flex items-center gap-1">
                     <button
                        onClick={() => openModal(bill)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(bill.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Bill Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                {editingBill ? 'Editar Conta' : 'Nova Conta'}
              </h2>
              
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ex: Conta de Luz"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Vencimento</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={e => setIsRecurring(e.target.checked)}
                    className="w-5 h-5 rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Conta Recorrente</p>
                    <p className="text-xs text-gray-500 font-medium">Repete todos os meses</p>
                  </div>
                </label>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-brand-primary/20"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

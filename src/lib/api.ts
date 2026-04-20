/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Goal } from '../types';

export const authState = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token: string) => localStorage.setItem('token', token),
  clearToken: () => localStorage.removeItem('token'),
};

const getHeaders = () => {
  const token = authState.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  getCurrentUser: async (): Promise<{user: {id: string, email: string}}> => {
    const res = await fetch('/api/auth/me', { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao obter usuário logado');
    return res.json();
  },

  getGoals: async (): Promise<Goal[]> => {
    const res = await fetch('/api/goals', { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao buscar metas');
    return res.json();
  },

  createGoal: async (goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> => {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(goal)
    });
    if (!res.ok) throw new Error('Falha ao criar meta');
    return res.json();
  },

  updateGoal: async (id: string, goal: Omit<Goal, 'id' | 'createdAt'> & { currentAmount: number }): Promise<Goal> => {
    const res = await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(goal)
    });
    if (!res.ok) throw new Error('Falha ao atualizar meta');
    return res.json();
  },

  deleteGoal: async (id: string): Promise<void> => {
    const res = await fetch(`/api/goals/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Falha ao deletar meta');
  }
};

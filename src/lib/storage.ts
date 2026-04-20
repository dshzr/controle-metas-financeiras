/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Goal } from '../types';

const STORAGE_KEY = 'finance_goals_data';

export const storage = {
  getGoals: (): Goal[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load goals from storage', error);
      return [];
    }
  },

  saveGoals: (goals: Goal[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error('Failed to save goals to storage', error);
    }
  },

  addGoal: (goal: Goal): void => {
    const goals = storage.getGoals();
    storage.saveGoals([...goals, goal]);
  },

  updateGoal: (updatedGoal: Goal): void => {
    const goals = storage.getGoals();
    storage.saveGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  },

  deleteGoal: (id: string): void => {
    const goals = storage.getGoals();
    storage.saveGoals(goals.filter(g => g.id !== id));
  }
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category: 'purchase' | 'investment' | 'emergency' | 'leisure' | 'other';
  createdAt: string;
}

export type Category = Goal['category'];

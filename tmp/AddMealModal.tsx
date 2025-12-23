import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { PortionCount } from '../types';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, items: string[], portions: PortionCount) => void;
}

const PORTION_TYPES = [
  { key: 'protein', label: 'Белки', color: 'bg-red-100 text-red-700', border: 'border-red-200' },
  { key: 'fat', label: 'Жиры', color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
  { key: 'carbs', label: 'Углеводы', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  { key: 'fiber', label: 'Клетчатка', color: 'bg-green-100 text-green-700', border: 'border-green-200' },
];

export const AddMealModal: React.FC<AddMealModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('Перекус');
  const [description, setDescription] = useState('');
  const [portions, setPortions] = useState<PortionCount>({ protein: 0, fat: 0, carbs: 0, fiber: 0 });

  if (!isOpen) return null;

  const handleIncrement = (key: keyof PortionCount) => {
    setPortions(prev => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const handleDecrement = (key: keyof PortionCount) => {
    setPortions(prev => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
  };

  const handleSubmit = () => {
    // Превращаем строку описания в массив для совместимости с интерфейсом
    const itemsArray = description ? [description] : [];
    onSave(name, itemsArray, portions);
    // Сброс формы
    setName('Перекус');
    setDescription('');
    setPortions({ protein: 0, fat: 0, carbs: 0, fiber: 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl transform transition-transform duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-textMain">Добавить прием пищи</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-textSec mb-1">Название</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              placeholder="Например: Ужин"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textSec mb-1">Что съели?</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Например: Творог, яблоко"
            />
          </div>
        </div>

        {/* Steppers */}
        <div className="space-y-3 mb-8">
          <label className="block text-sm font-medium text-textSec">Порции</label>
          <div className="grid grid-cols-2 gap-3">
            {PORTION_TYPES.map((type) => {
              const count = portions[type.key as keyof PortionCount];
              return (
                <div key={type.key} className={`p-3 rounded-xl border ${type.border} bg-white flex items-center justify-between`}>
                  <div className={`text-xs font-bold px-2 py-1 rounded ${type.color}`}>
                    {type.label}
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleDecrement(type.key as keyof PortionCount)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold hover:bg-gray-200 active:scale-95"
                    >
                      -
                    </button>
                    <span className="font-bold w-4 text-center">{count}</span>
                    <button 
                      onClick={() => handleIncrement(type.key as keyof PortionCount)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 font-bold hover:bg-gray-200 active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <button 
          onClick={handleSubmit}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:bg-green-600 active:scale-95 transition-all"
        >
          <Check size={20} />
          Сохранить
        </button>
      </div>
    </div>
  );
};
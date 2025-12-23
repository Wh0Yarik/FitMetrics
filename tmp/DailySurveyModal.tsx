import React, { useState } from 'react';
import { X, Check, Moon, Activity, Zap } from 'lucide-react';

interface DailySurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { motivation: number; stress: number; sleepHours: number; comment: string }) => void;
}

export const DailySurveyModal: React.FC<DailySurveyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [motivation, setMotivation] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSave({ motivation, stress, sleepHours, comment });
    onClose();
  };

  // Компонент слайдера
  const RangeSlider = ({ 
    label, 
    value, 
    onChange, 
    min = 1, 
    max = 10,
    icon: Icon,
    colorClass
  }: { 
    label: string, 
    value: number, 
    onChange: (val: number) => void,
    min?: number,
    max?: number,
    icon: React.ElementType,
    colorClass: string
  }) => (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 text-textMain font-medium">
          <Icon size={18} className="text-textSec" />
          {label}
        </div>
        <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step="0.5"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-xs text-textSec mt-2">
        <span>Низкий</span>
        <span>Высокий</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl transform transition-transform duration-300 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-textMain">Утренняя анкета</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 mb-8">
          {/* Motivation */}
          <RangeSlider 
            label="Мотивация" 
            value={motivation} 
            onChange={setMotivation} 
            icon={Zap}
            colorClass="text-secondary"
          />

          {/* Stress */}
          <RangeSlider 
            label="Уровень стресса" 
            value={stress} 
            onChange={setStress} 
            icon={Activity}
            colorClass="text-danger"
          />

          {/* Sleep */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-textMain font-medium">
              <Moon size={18} className="text-textSec" />
              Сон (часов)
            </div>
            <div className="flex items-center gap-3">
               <button 
                onClick={() => setSleepHours(prev => Math.max(0, prev - 0.5))}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-500"
               >-</button>
               <span className="text-xl font-bold text-textMain w-12 text-center">{sleepHours}</span>
               <button 
                onClick={() => setSleepHours(prev => Math.min(24, prev + 0.5))}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-500"
               >+</button>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-textSec mb-2">Комментарий (опционально)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Как самочувствие? Есть жалобы?"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-24 resize-none text-sm"
            />
          </div>
        </div>

        {/* Save Button */}
        <button 
          onClick={handleSubmit}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:bg-green-600 active:scale-95 transition-all"
        >
          <Check size={20} />
          Отправить отчет
        </button>
      </div>
    </div>
  );
};
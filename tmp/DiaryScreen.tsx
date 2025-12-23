import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, CheckCircle, AlertCircle, Utensils, Trash2, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell } from 'recharts';
import { AddMealModal } from '../components/AddMealModal';
import { DailySurveyModal } from '../components/DailySurveyModal';
import { WeightModal } from '../components/WeightModal';

export const DiaryScreen: React.FC = () => {
  const { 
    user, 
    todayStats, 
    todayMeals, 
    addMeal, 
    deleteMeal,
    dailySurveyCompleted, 
    weightLoggedToday,
    syncStatus,
    submitSurvey,
    logWeight
  } = useApp();
  
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  
  const goals = user.nutritionGoals || { dailyProtein: 5, dailyFat: 3, dailyCarbs: 5, dailyFiber: 3 };
  
  // Расчет общего прогресса
  const totalPortionsConsumed = todayStats.protein + todayStats.fat + todayStats.carbs + todayStats.fiber;
  const totalPortionsGoal = goals.dailyProtein + goals.dailyFat + goals.dailyCarbs + goals.dailyFiber;
  const progressPercentage = totalPortionsGoal > 0 
    ? Math.min(100, Math.round((totalPortionsConsumed / totalPortionsGoal) * 100))
    : 0;

  // Данные для диаграммы
  const isEmpty = totalPortionsConsumed === 0;
  const macroData = isEmpty 
    ? [{ name: 'Empty', value: 1, color: '#E5E7EB' }]
    : [
        { name: 'Белки', value: todayStats.protein, color: '#EF4444' }, // Red
        { name: 'Жиры', value: todayStats.fat, color: '#F97316' },     // Orange
        { name: 'Углеводы', value: todayStats.carbs, color: '#3B82F6' }, // Blue
        { name: 'Клетчатка', value: todayStats.fiber, color: '#22C55E' }, // Green
      ];

  const PortionBadge = ({ label, value, colorClass }: { label: string, value: number, colorClass: string }) => {
    if (value === 0) return null;
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${colorClass}`}>
        <span>{label}:</span>
        <span>{value}</span>
      </div>
    );
  };

  const SummaryItem = ({ label, current, target, colorClass }: { label: string, current: number, target: number, colorClass: string }) => (
    <div className="flex flex-col items-center">
      <div className="text-[10px] text-textSec mb-1">{label}</div>
      <div className={`font-bold text-lg ${colorClass}`}>
        {current} <span className="text-gray-300 text-sm">/ {target}</span>
      </div>
    </div>
  );

  // Компонент статуса синхронизации
  const SyncIndicator = () => {
    if (syncStatus === 'syncing') {
      return <RefreshCw size={16} className="text-primary animate-spin" />;
    }
    if (syncStatus === 'offline') {
      return <CloudOff size={16} className="text-gray-400" />;
    }
    return <Cloud size={16} className="text-primary" />;
  };

  return (
    <div className="pb-24">
      <AddMealModal 
        isOpen={isMealModalOpen} 
        onClose={() => setIsMealModalOpen(false)}
        onSave={(name, items, portions) => {
          const now = new Date();
          const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          addMeal({ name, items, portions, time: timeString });
        }}
      />

      <DailySurveyModal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        onSave={(data) => submitSurvey({ ...data, weight: user.currentWeight })}
      />

      <WeightModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        onSave={logWeight}
        currentWeight={user.currentWeight}
      />

      {/* Header */}
      <div className="bg-white p-6 pb-4 rounded-b-3xl shadow-sm border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-textMain">Сегодня</h1>
              <div className="mt-1"><SyncIndicator /></div>
            </div>
            <p className="text-textSec text-sm">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0)
            )}
          </div>
        </div>

        {/* Macro Summary Card */}
        <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex-1">
             <div className="text-sm text-textSec mb-1">Дневная норма</div>
             <div className="text-3xl font-bold text-textMain">{progressPercentage}%</div>
             <div className="text-xs text-textSec mb-3">выполнено (порции)</div>
             
             <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
               <div className="bg-primary h-full rounded-full" style={{ width: `${progressPercentage}%` }}></div>
             </div>
          </div>
          <div className="w-20 h-20 ml-4 relative flex items-center justify-center">
             <PieChart width={80} height={80}>
               <Pie
                 data={macroData}
                 innerRadius={25}
                 outerRadius={35}
                 paddingAngle={isEmpty ? 0 : 5}
                 dataKey="value"
                 isAnimationActive={true}
               >
                 {macroData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.color} />
                 ))}
               </Pie>
             </PieChart>
             <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-400 font-bold">
               План
             </div>
          </div>
        </div>
        
        {/* Targets Grid */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          <SummaryItem label="Белки" current={todayStats.protein} target={goals.dailyProtein} colorClass="text-red-600" />
          <SummaryItem label="Жиры" current={todayStats.fat} target={goals.dailyFat} colorClass="text-orange-500" />
          <SummaryItem label="Угли" current={todayStats.carbs} target={goals.dailyCarbs} colorClass="text-blue-500" />
          <SummaryItem label="Клетчатка" current={todayStats.fiber} target={goals.dailyFiber} colorClass="text-green-600" />
        </div>
      </div>

      {/* Daily Tasks */}
      <div className="p-6">
        <h2 className="text-lg font-bold text-textMain mb-4">Задачи на день</h2>
        
        <div className="space-y-3">
          {/* Survey Task */}
          <div 
            className={`bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between transition-all ${
              dailySurveyCompleted ? 'border-green-100 bg-green-50/30' : 'border-gray-100'
            }`}
          >
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dailySurveyCompleted ? 'bg-green-100 text-green-600' : 'bg-red-50 text-danger'}`}>
                 {dailySurveyCompleted ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
               </div>
               <div>
                 <div className={`font-medium ${dailySurveyCompleted ? 'text-green-900' : 'text-textMain'}`}>Утренняя анкета</div>
                 <div className="text-xs text-textSec">
                   {dailySurveyCompleted ? 'Выполнено' : 'Не заполнено'}
                 </div>
               </div>
             </div>
             {!dailySurveyCompleted && (
               <button 
                onClick={() => setIsSurveyModalOpen(true)}
                className="bg-primary text-white text-sm px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-green-600 active:scale-95 transition-all"
               >
                 Заполнить
               </button>
             )}
          </div>

          {/* Weight Task */}
          <div 
             className={`bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between transition-all ${
              weightLoggedToday ? 'border-green-100 bg-green-50/30' : 'border-gray-100'
            }`}
          >
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${weightLoggedToday ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-500'}`}>
                 {weightLoggedToday ? <CheckCircle size={20} /> : <CheckCircle size={20} />}
               </div>
               <div>
                 <div className={`font-medium ${weightLoggedToday ? 'text-green-900' : 'text-textMain'}`}>Замеры веса</div>
                 <div className="text-xs text-textSec">
                   {weightLoggedToday 
                     ? `${user.currentWeight} кг • Сегодня` 
                     : `${user.currentWeight} кг (предыдущий)`}
                 </div>
               </div>
             </div>
             {!weightLoggedToday && (
               <button 
                 onClick={() => setIsWeightModalOpen(true)}
                 className="bg-white border border-gray-200 text-textMain text-sm px-4 py-2 rounded-lg font-medium hover:bg-gray-50 active:scale-95 transition-all"
               >
                 Внести
               </button>
             )}
          </div>
        </div>
      </div>

      {/* Meals */}
      <div className="px-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-textMain">Приемы пищи</h2>
          <button 
            onClick={() => setIsMealModalOpen(true)}
            className="text-primary text-sm font-medium flex items-center gap-1 hover:text-green-700 transition-colors"
          >
            <Plus size={16} /> Добавить
          </button>
        </div>

        <div className="space-y-4">
          {todayMeals.length === 0 ? (
             <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-dashed border-gray-200">
               Пока нет записей. Добавьте первый прием пищи!
             </div>
          ) : (
            todayMeals.map((meal) => (
              <div key={meal.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Utensils size={16} className="text-textSec" />
                    <span className="font-bold text-textMain">{meal.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{meal.time}</span>
                  </div>
                  <button 
                    onClick={() => deleteMeal(meal.id)}
                    className="p-1.5 text-gray-300 hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Удалить"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Порции */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <PortionBadge label="Белки" value={meal.portions.protein} colorClass="bg-red-100 text-red-700" />
                  <PortionBadge label="Жиры" value={meal.portions.fat} colorClass="bg-orange-100 text-orange-700" />
                  <PortionBadge label="Угли" value={meal.portions.carbs} colorClass="bg-blue-100 text-blue-700" />
                  <PortionBadge label="Клетч" value={meal.portions.fiber} colorClass="bg-green-100 text-green-700" />
                </div>

                {meal.items.length > 0 && (
                  <div className="border-t border-gray-50 pt-2">
                     <ul className="text-sm text-textSec space-y-1 ml-1">
                      {meal.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                           <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                           {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
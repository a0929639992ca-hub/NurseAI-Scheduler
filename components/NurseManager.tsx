import React, { useState, useEffect } from 'react';
import { Nurse, Unit, MajorShiftType } from '../types';
import { getNurses, saveNurse, deleteNurse } from '../services/storage';
import { Plus, Trash2, User, Pencil, Save, X } from 'lucide-react';

const NurseManager: React.FC = () => {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Nurse>>({
    name: '',
    employeeId: '',
    unit: Unit.U9E,
    majorShift: MajorShiftType.A
  });

  useEffect(() => {
    refreshList();
  }, []);

  const refreshList = () => {
    setNurses(getNurses());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.employeeId || !formData.unit || !formData.majorShift) return;

    const nurseToSave: Nurse = {
      id: editingId || Date.now().toString(),
      name: formData.name,
      employeeId: formData.employeeId,
      unit: formData.unit,
      majorShift: formData.majorShift
    };

    saveNurse(nurseToSave);
    resetForm();
    refreshList();
  };

  const resetForm = () => {
    setFormData({ name: '', employeeId: '', unit: Unit.U9E, majorShift: MajorShiftType.A });
    setEditingId(null);
  };

  const handleEdit = (nurse: Nurse) => {
    setEditingId(nurse.id);
    setFormData({
      name: nurse.name,
      employeeId: nurse.employeeId,
      unit: nurse.unit,
      majorShift: nurse.majorShift
    });
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除這位護理師嗎？')) {
      deleteNurse(id);
      refreshList();
      if (editingId === id) {
        resetForm();
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <User className="w-6 h-6 text-primary" />
        人員管理
      </h2>

      {/* Add/Edit Form */}
      <div className={`mb-8 p-4 rounded-lg border transition-colors ${editingId ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="mb-4 flex items-center justify-between">
            <h3 className={`font-bold flex items-center gap-2 ${editingId ? 'text-yellow-800' : 'text-slate-700'}`}>
                {editingId ? <Pencil className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                {editingId ? '編輯人員資料' : '新增人員'}
            </h3>
            {editingId && (
                <button 
                  type="button"
                  onClick={resetForm} 
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 px-2 py-1 hover:bg-slate-200 rounded transition-colors"
                >
                    <X className="w-4 h-4" /> 取消編輯
                </button>
            )}
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
            <input
              type="text"
              className="w-full border-slate-300 rounded-md shadow-sm p-2 border focus:ring-primary focus:border-primary"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="請輸入姓名"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">員工代號</label>
            <input
              type="text"
              className="w-full border-slate-300 rounded-md shadow-sm p-2 border focus:ring-primary focus:border-primary"
              value={formData.employeeId}
              onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
              placeholder="例如: N001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">單位</label>
            <select
              className="w-full border-slate-300 rounded-md shadow-sm p-2 border focus:ring-primary focus:border-primary"
              value={formData.unit}
              onChange={e => setFormData({ ...formData, unit: e.target.value as Unit })}
            >
              <option value={Unit.U9E}>9E</option>
              <option value={Unit.U10E}>10E</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">當月大班</label>
            <select
              className="w-full border-slate-300 rounded-md shadow-sm p-2 border focus:ring-primary focus:border-primary"
              value={formData.majorShift}
              onChange={e => setFormData({ ...formData, majorShift: e.target.value as MajorShiftType })}
            >
              <option value={MajorShiftType.A}>A (白班)</option>
              <option value={MajorShiftType.E}>E (小夜)</option>
              <option value={MajorShiftType.N}>N (大夜)</option>
              <option value={MajorShiftType.C}>C (C班 14-22)</option>
              <option value={MajorShiftType.F}>F (F班 支援)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className={`w-full text-white p-2 rounded-md transition-colors flex items-center justify-center gap-2 ${editingId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <Save className="w-4 h-4" />
              {editingId ? '更新' : '儲存'}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">姓名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">代號</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">單位</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">大班</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {nurses.map((nurse) => (
              <tr key={nurse.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{nurse.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{nurse.employeeId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{nurse.unit}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{nurse.majorShift}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(nurse)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(nurse.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {nurses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  目前沒有資料，請新增人員。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NurseManager;
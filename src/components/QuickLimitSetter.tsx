import React, { useState } from 'react';
import { Users, Plus, Minus, Save, X } from 'lucide-react';
import { supabase, User } from '../lib/supabase';
import toast from 'react-hot-toast';

interface QuickLimitSetterProps {
  users: User[];
  onUpdate: () => void;
  userRole: 'admin' | 'manager' | 'user';
}

const QuickLimitSetter: React.FC<QuickLimitSetterProps> = ({ users, onUpdate, userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [limits, setLimits] = useState<{ [key: string]: number }>({});
  const [saving, setSaving] = useState(false);

  // Filter users based on role permissions
  const filteredUsers = users.filter(user => {
    if (userRole === 'admin') {
      return true; // Admin can manage all users
    } else if (userRole === 'manager') {
      return user.role === 'user'; // Manager can only manage regular users
    }
    return false;
  });

  const handleOpen = () => {
    // Initialize limits with current user limits
    const initialLimits: { [key: string]: number } = {};
    filteredUsers.forEach(user => {
      initialLimits[user.id] = user.daily_limit;
    });
    setLimits(initialLimits);
    setIsOpen(true);
  };

  const updateLimit = (userId: string, change: number) => {
    setLimits(prev => ({
      ...prev,
      [userId]: Math.max(0, (prev[userId] || 0) + change)
    }));
  };

  const setPresetLimit = (userId: string, limit: number) => {
    setLimits(prev => ({
      ...prev,
      [userId]: limit
    }));
  };

  const saveAllLimits = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(limits).map(([userId, limit]) => 
        supabase
          .from('users')
          .update({ daily_limit: limit })
          .eq('id', userId)
      );

      await Promise.all(updates);
      
      toast.success('সকল ইউজারের লিমিট আপডেট হয়েছে!');
      setIsOpen(false);
      onUpdate();
    } catch (error) {
      toast.error('লিমিট আপডেট করতে সমস্যা হয়েছে');
      console.error('Error updating limits:', error);
    } finally {
      setSaving(false);
    }
  };

  const presetLimits = [100, 200, 300, 500, 1000];

  if (filteredUsers.length === 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        <Users className="w-5 h-5" />
        <span className="font-medium">দ্রুত লিমিট সেট করুন</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">দ্রুত লিমিট সেট করুন</h2>
                  <p className="text-blue-100 mt-1">সকল ইউজারের দৈনিক লিমিট একসাথে সেট করুন</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.username}</h3>
                        <p className="text-sm text-gray-500">
                          বর্তমান লিমিট: {user.daily_limit} | 
                          স্ট্যাটাস: <span className={user.is_active ? 'text-green-600' : 'text-red-600'}>
                            {user.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {limits[user.id] || 0}
                        </div>
                        <div className="text-xs text-gray-500">নতুন লিমিট</div>
                      </div>
                    </div>

                    {/* Preset Buttons */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {presetLimits.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setPresetLimit(user.id, preset)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            limits[user.id] === preset
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    {/* Manual Controls */}
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={() => updateLimit(user.id, -50)}
                        className="bg-red-100 text-red-600 hover:bg-red-200 rounded-full p-2 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateLimit(user.id, -10)}
                        className="bg-orange-100 text-orange-600 hover:bg-orange-200 rounded-full p-1 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      
                      <input
                        type="number"
                        value={limits[user.id] || 0}
                        onChange={(e) => setLimits(prev => ({
                          ...prev,
                          [user.id]: Math.max(0, parseInt(e.target.value) || 0)
                        }))}
                        className="w-20 text-center border border-gray-300 rounded-lg px-2 py-1 font-semibold"
                        min="0"
                      />
                      
                      <button
                        onClick={() => updateLimit(user.id, 10)}
                        className="bg-green-100 text-green-600 hover:bg-green-200 rounded-full p-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => updateLimit(user.id, 50)}
                        className="bg-green-100 text-green-600 hover:bg-green-200 rounded-full p-2 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                বাতিল করুন
              </button>
              <button
                onClick={saveAllLimits}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>সেভ করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>সকল লিমিট সেভ করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickLimitSetter;
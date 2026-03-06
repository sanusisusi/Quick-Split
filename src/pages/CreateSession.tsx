import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Users, Receipt } from 'lucide-react';

type CreateSessionProps = {
  onSessionCreated: (sessionId: string) => void;
};

export default function CreateSession({ onSessionCreated }: CreateSessionProps) {
  const [formData, setFormData] = useState({
    name: '',
    createdBy: '',
    totalAmount: '',
    tip: '',
    tax: '',
    splitType: 'equal' as 'equal' | 'items' | 'custom'
  });
  const [items, setItems] = useState<{ name: string; price: string; quantity: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([...items, { name: '', price: '', quantity: '1' }]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalFromItems = formData.splitType === 'items' ? calculateTotal() : parseFloat(formData.totalAmount);
      const tipAmount = parseFloat(formData.tip) || 0;
      const taxAmount = parseFloat(formData.tax) || 0;

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          name: formData.name,
          created_by: formData.createdBy,
          total_amount: totalFromItems + tipAmount + taxAmount,
          tip: tipAmount,
          tax: taxAmount,
          status: 'active',
          split_type: formData.splitType
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      if (formData.splitType === 'items' && items.length > 0) {
        const itemsToInsert = items.map(item => ({
          session_id: session.id,
          name: item.name,
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity)
        }));

        const { error: itemsError } = await supabase
          .from('items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      onSessionCreated(session.id);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Quick Split</h1>
          <p className="text-gray-600">Create a new bill session</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event / Restaurant Name
            </label>
            <div className="relative">
              <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Dinner at Mai Suya"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name (Host)
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                required
                value={formData.createdBy}
                onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, splitType: 'equal' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.splitType === 'equal'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">Equal Split</div>
                <div className="text-sm text-gray-500">Everyone pays same</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, splitType: 'items' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.splitType === 'items'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">By Items</div>
                <div className="text-sm text-gray-500">Split by order</div>
              </button>
            </div>
          </div>

          {formData.splitType === 'equal' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Bill Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Bill Items
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Item
                </button>
              </div>
              {items.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Item name"
                  />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Price"
                  />
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="w-16 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Qty"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
              {items.length > 0 && (
                <div className="text-right text-sm text-gray-600">
                  Subtotal: ₦{calculateTotal().toFixed(2)}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tip (optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.tip}
                onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax (optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Session...' : 'Create Session & Generate QR Code'}
          </button>
        </form>
      </div>
    </div>
  );
}

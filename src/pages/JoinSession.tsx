import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, Item, Participant } from '../lib/database.types';
import { UserPlus, CheckCircle, Receipt } from 'lucide-react';

type JoinSessionProps = {
  sessionId: string;
  onJoined: (participantId: string) => void;
};

export default function JoinSession({ sessionId, onJoined }: JoinSessionProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [name, setName] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      const [sessionResult, itemsResult, participantsResult] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', sessionId).maybeSingle(),
        supabase.from('items').select('*').eq('session_id', sessionId),
        supabase.from('participants').select('*').eq('session_id', sessionId)
      ]);

      if (sessionResult.error) throw sessionResult.error;
      if (!sessionResult.data) {
        alert('Session not found');
        return;
      }

      setSession(sessionResult.data);
      setItems(itemsResult.data || []);
      setParticipants(participantsResult.data || []);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const current = prev[itemId] || 0;
      if (current > 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      } else {
        return { ...prev, [itemId]: 1 };
      }
    });
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      const { [itemId]: _, ...rest } = selectedItems;
      setSelectedItems(rest);
    } else {
      setSelectedItems(prev => ({ ...prev, [itemId]: quantity }));
    }
  };

  const calculateAmount = () => {
    if (!session) return 0;

    if (session.split_type === 'equal') {
      const participantCount = participants.length + 1;
      return session.total_amount / participantCount;
    }

    const itemsTotal = Object.entries(selectedItems).reduce((sum, [itemId, quantity]) => {
      const item = items.find(i => i.id === itemId);
      if (!item) return sum;
      return sum + (item.price * quantity);
    }, 0);

    const tipPerItem = session.tip / items.length;
    const taxPerItem = session.tax / items.length;
    const selectedItemCount = Object.keys(selectedItems).length;

    return itemsTotal + (tipPerItem * selectedItemCount) + (taxPerItem * selectedItemCount);
  };

  const handleJoin = async () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }

    if (session?.split_type === 'items' && Object.keys(selectedItems).length === 0) {
      alert('Please select at least one item');
      return;
    }

    setJoining(true);

    try {
      const amount = calculateAmount();

      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .insert({
          session_id: sessionId,
          name: name.trim(),
          amount_owed: amount,
          paid: false,
          payment_method: 'qr'
        })
        .select()
        .single();

      if (participantError) throw participantError;

      if (session?.split_type === 'items' && Object.keys(selectedItems).length > 0) {
        const participantItems = Object.entries(selectedItems).map(([itemId, quantity]) => ({
          participant_id: participant.id,
          item_id: itemId,
          quantity
        }));

        const { error: itemsError } = await supabase
          .from('participant_items')
          .insert(participantItems);

        if (itemsError) throw itemsError;
      }

      onJoined(participant.id);
    } catch (error) {
      console.error('Error joining session:', error);
      alert('Failed to join session. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-gray-600">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Session not found</p>
        </div>
      </div>
    );
  }

  const amount = calculateAmount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Split & Tap</h1>
          <p className="text-gray-600">Join the bill</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center pb-6 border-b border-gray-200">
            <Receipt className="w-12 h-12 mx-auto text-blue-600 mb-3" />
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{session.name}</h2>
            <p className="text-gray-600">Hosted by {session.created_by}</p>
            <div className="mt-4 inline-block bg-blue-50 px-6 py-3 rounded-lg">
              <div className="text-sm text-gray-600">Total Bill</div>
              <div className="text-3xl font-bold text-blue-600">₦{session.total_amount.toFixed(2)}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <div className="relative">
              <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>
          </div>

          {session.split_type === 'equal' ? (
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-2">Equal Split</div>
              <div className="text-3xl font-bold text-gray-900">₦{amount.toFixed(2)}</div>
              <div className="text-sm text-gray-500 mt-2">
                Split among {participants.length + 1} people
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Your Items
              </label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {items.map((item) => {
                  const isSelected = selectedItems[item.id] > 0;
                  const quantity = selectedItems[item.id] || 1;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleItem(item.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            ₦{item.price.toFixed(2)} × {item.quantity}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateItemQuantity(item.id, quantity - 1);
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-white rounded-full border border-gray-300 hover:bg-gray-50"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-medium">{quantity}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateItemQuantity(item.id, quantity + 1);
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-white rounded-full border border-gray-300 hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                            <CheckCircle className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.keys(selectedItems).length > 0 && (
                <div className="mt-4 bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Your Total</div>
                  <div className="text-2xl font-bold text-gray-900">₦{amount.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Including proportional tip and tax
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={joining || !name.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {joining ? 'Joining...' : `Join Bill - ₦${amount.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

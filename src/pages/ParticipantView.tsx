import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Participant, Session } from '../lib/database.types';
import { CheckCircle, Clock, Receipt, Users } from 'lucide-react';

type ParticipantViewProps = {
  participantId: string;
};

export default function ParticipantView({ participantId }: ParticipantViewProps) {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel(`participant:${participantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'participants',
          filter: `id=eq.${participantId}`
        },
        (payload) => {
          setParticipant(payload.new as Participant);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [participantId]);

  const loadData = async () => {
    try {
      const { data: participantData, error: participantError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', participantId)
        .maybeSingle();

      if (participantError) throw participantError;
      if (!participantData) {
        alert('Participant not found');
        return;
      }

      setParticipant(participantData);

      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', participantData.session_id)
        .maybeSingle();

      if (sessionError) throw sessionError;
      setSession(sessionData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!participant) return;

    setPaying(true);
    try {
      const { error } = await supabase
        .from('participants')
        .update({ paid: true })
        .eq('id', participant.id);

      if (error) throw error;

      setParticipant({ ...participant, paid: true });
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Failed to confirm payment. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!participant || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Participant or session not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Split & Tap</h1>
          <p className="text-gray-600">Payment Summary</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center pb-6 border-b border-gray-200">
            <Receipt className="w-12 h-12 mx-auto text-blue-600 mb-3" />
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{session.name}</h2>
            <p className="text-gray-600">Hosted by {session.created_by}</p>
          </div>

          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              participant.paid ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Users className={`w-10 h-10 ${participant.paid ? 'text-green-600' : 'text-gray-600'}`} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              Welcome, {participant.name}!
            </h3>
            <p className="text-gray-600">
              {participant.paid ? 'Payment confirmed' : 'Your payment is pending'}
            </p>
          </div>

          <div className={`p-6 rounded-xl text-center ${
            participant.paid ? 'bg-green-50' : 'bg-blue-50'
          }`}>
            <div className="text-sm text-gray-600 mb-2">Your Share</div>
            <div className="text-4xl font-bold text-gray-900 mb-1">
              ₦{participant.amount_owed.toFixed(2)}
            </div>
            {session.split_type === 'equal' && (
              <div className="text-sm text-gray-500">Equal split</div>
            )}
          </div>

          {participant.paid ? (
            <div className="flex items-center justify-center gap-3 p-6 bg-green-50 rounded-lg text-green-700">
              <CheckCircle className="w-6 h-6" />
              <div>
                <div className="font-semibold">Payment Confirmed</div>
                <div className="text-sm">Thank you for settling your share!</div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-3 p-4 bg-orange-50 rounded-lg text-orange-700">
                <Clock className="w-5 h-5" />
                <div className="text-sm">
                  <div className="font-semibold">Payment Pending</div>
                  <div>Confirm once you've paid your share</div>
                </div>
              </div>

              <button
                onClick={handleConfirmPayment}
                disabled={paying}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paying ? 'Confirming...' : 'Confirm Payment'}
              </button>

              <p className="text-xs text-center text-gray-500">
                This is a demo. In production, this would integrate with a payment gateway.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

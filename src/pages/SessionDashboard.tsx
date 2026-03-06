import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, Participant } from '../lib/database.types';
import { QrCode, Users, CheckCircle, Clock, Copy, Share2 } from 'lucide-react';

type SessionDashboardProps = {
  sessionId: string;
  onBack: () => void;
};

export default function SessionDashboard({ sessionId, onBack }: SessionDashboardProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const joinUrl = `${window.location.origin}${window.location.pathname}#join/${sessionId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`;

  useEffect(() => {
    loadSessionData();

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          loadParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const loadSessionData = async () => {
    await Promise.all([loadSession(), loadParticipants()]);
    setLoading(false);
  };

  const loadSession = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error loading session:', error);
      return;
    }

    setSession(data);
  };

  const loadParticipants = async () => {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error loading participants:', error);
      return;
    }

    setParticipants(data || []);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Split & Tap Session',
          text: `Join the bill for ${session?.name}`,
          url: joinUrl
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyToClipboard();
    }
  };

  const totalPaid = participants.filter(p => p.paid).reduce((sum, p) => sum + p.amount_owed, 0);
  const totalOwed = participants.reduce((sum, p) => sum + p.amount_owed, 0);
  const progress = totalOwed > 0 ? (totalPaid / totalOwed) * 100 : 0;

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
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            ← Create New Session
          </button>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{session.name}</h1>
                <p className="text-gray-600">Host: {session.created_by}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">₦{session.total_amount.toFixed(2)}</div>
                <div className="text-sm text-gray-500">Total Bill</div>
              </div>
            </div>

            <div className="flex items-center justify-center bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 mb-6">
              <div className="text-center">
                <div className="mb-4">
                  <QrCode className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">Scan to Join</h3>
                  <p className="text-sm text-gray-500">Show this QR code to participants</p>
                </div>
                <img
                  src={qrCodeUrl}
                  alt="Session QR Code"
                  className="mx-auto rounded-lg shadow-lg"
                />
                <div className="mt-4 space-y-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={shareLink}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Link
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Payment Progress</span>
                <span className="text-sm text-gray-600">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>₦{totalPaid.toFixed(2)} paid</span>
                <span>₦{totalOwed.toFixed(2)} total</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Participants ({participants.length})
                </h2>
              </div>

              {participants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No participants yet</p>
                  <p className="text-sm mt-1">Share the QR code or link to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                          participant.paid ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {participant.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{participant.name}</div>
                          <div className="text-sm text-gray-500">
                            ₦{participant.amount_owed.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {participant.paid ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Paid</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-orange-600">
                            <Clock className="w-5 h-5" />
                            <span className="text-sm font-medium">Pending</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

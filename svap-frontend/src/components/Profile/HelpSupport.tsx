import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, MessageCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../../services/supabase";

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'replied' | 'closed';
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export default function HelpSupport() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'new' | 'tickets'>('new');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const userId = (() => {
    try {
      return JSON.parse(localStorage.getItem('sz_user') || '{}').id;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (activeTab === 'tickets' && userId) {
      fetchTickets();
    }
  }, [activeTab, userId]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert('Please login to submit a support ticket');
      navigate('/login');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userId,
          subject: subject.trim(),
          message: message.trim(),
          status: 'open'
        });

      if (error) throw error;

      alert('✅ Support ticket submitted successfully!');
      setSubject('');
      setMessage('');
      setActiveTab('tickets');
      fetchTickets();
    } catch (err: any) {
      console.error('Error submitting ticket:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock size={16} className="text-yellow-500" />;
      case 'replied':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'closed':
        return <XCircle size={16} className="text-gray-500" />;
      default:
        return <MessageCircle size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'replied':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'closed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Help & Support</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'new' ? 'text-[#E45821]' : 'text-white/60'
            }`}
          >
            New Ticket
            {activeTab === 'new' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E45821]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'tickets' ? 'text-[#E45821]' : 'text-white/60'
            }`}
          >
            My Tickets
            {activeTab === 'tickets' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E45821]" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {activeTab === 'new' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#E45821] transition-colors"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue in detail..."
                rows={8}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#E45821] transition-colors resize-none"
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#E45821] hover:bg-[#d14a1a] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send size={18} />
                  Submit Ticket
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-white/50">Loading...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>No support tickets yet</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{ticket.subject}</h3>
                      <p className="text-xs text-white/50">
                        {new Date(ticket.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {getStatusIcon(ticket.status)}
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-white/70 leading-relaxed">{ticket.message}</p>

                  {/* Admin Reply */}
                  {ticket.admin_reply && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs font-semibold text-[#E45821] mb-2">Admin Reply:</p>
                      <p className="text-sm text-white/80 leading-relaxed bg-[#E45821]/10 border border-[#E45821]/20 rounded-lg p-3">
                        {ticket.admin_reply}
                      </p>
                      {ticket.replied_at && (
                        <p className="text-xs text-white/40 mt-2">
                          Replied on {new Date(ticket.replied_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  MessageSquare,
  Search,
  Send,
  Phone,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  User,
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { chatService } from '../../services/chatService';
import { localPatients, localSettings } from '../../services/localStore';
import { formatDisplayDate } from '../../services/automatedRemindersService';
import PatientAvatar from '../../components/common/PatientAvatar';

export default function ChatPage() {
  const { activeClinic, user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get('patientId');

  const [conversations, setConversations] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);
  const clinic = localSettings.get();

  const clinicName = activeClinic?.name || clinic?.clinicName || 'ClinixPulse Clinic';
  const doctorName = user?.fullName || activeClinic?.doctorName || clinic?.doctorName || 'Dr. Snehal Makwana';
  const clinicAddress = activeClinic?.addressLine1 ? `${activeClinic.addressLine1}, ${activeClinic.city}` : clinic?.address || 'Clinic OPD Center';
  const timings = activeClinic?.timings || clinic?.timing || '10:00 AM - 02:00 PM and 05:00 PM - 09:00 PM';

  const quickTemplates = useMemo(() => [
    {
      label: 'Follow-up Confirmation',
      text: `Hi! This is ${clinicName}. We would like to confirm your follow-up appointment scheduled for tomorrow with ${doctorName}. * Tap 'Yes' to confirm. * Tap 'No' if you are not coming.`,
    },
    {
      label: 'Prescription Ready',
      text: `Hello! Your prescription and medication advice from ${doctorName} at ${clinicName} have been processed. Please take medicines as directed.`,
    },
    {
      label: 'Clinic Address & Timings',
      text: `${clinicName} OPD Timings: ${timings}. Location: ${clinicAddress}.`,
    },
    {
      label: 'Test Reports Follow-up',
      text: `Namaste! Please bring your latest investigation/lab reports during your consultation checkup at ${clinicName}.`,
    },
  ], [clinicName, doctorName, clinicAddress, timings]);

  const loadConversations = () => {
    const list = chatService.getConversations();
    setConversations(list);
    if (!selectedPatientId && list.length > 0) {
      setSelectedPatientId(list[0].patientId);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      const thread = chatService.getThread(selectedPatientId);
      setMessages(thread);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activePatient = localPatients.getById(selectedPatientId);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedPatientId) return;

    const res = chatService.sendMessage(selectedPatientId, inputText);
    if (res) {
      setMessages(chatService.getThread(selectedPatientId));
      setInputText('');
      loadConversations();
      // Open WhatsApp web with text
      window.open(res.waUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleApplyTemplate = (tmpl) => {
    setInputText(tmpl.text);
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.patientName.toLowerCase().includes(q) ||
      (c.contact && c.contact.includes(q))
    );
  });

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0">
      {/* Top Banner */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9E6E2]">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#287C75] border border-teal-100 shadow-sm">
            <MessageSquare size={18} />
          </span>
          <div>
            <h1 className="font-heading text-lg font-bold text-[#10201F] leading-tight">
              WhatsApp Communication & Patient Chat
            </h1>
            <p className="text-xs text-[#4E6460]">
              Track automated follow-up reminders, receive patient confirmations, and send direct WhatsApp messages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            WhatsApp Business API Ready
          </span>
        </div>
      </div>

      {/* Main 2-Panel Chat Studio - Fixed Viewport Space like WhatsApp Web */}
      <div className="mt-3 flex-1 min-h-0 flex flex-col md:flex-row bg-white rounded-2xl border border-[#D9E6E2] shadow-clinixpulse-xs overflow-hidden">
        {/* Left Column: Conversations List - Fixed Width & Independently Scrollable */}
        <div className="w-full md:w-[340px] lg:w-[380px] shrink-0 border-r border-[#D9E6E2] flex flex-col h-full bg-[#F7FAF8]/50 overflow-hidden">
          {/* Search Box */}
          <div className="shrink-0 p-3 border-b border-[#D9E6E2] bg-white">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7D908C]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient or mobile..."
                className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] py-1.5 pl-8 pr-3 text-xs text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          {/* Conversations Thread List - scrollable contacts as contacts grow */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#EBF1EE]">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#7D908C]">
                No patient chats matching your search.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = c.patientId === selectedPatientId;
                const initials = c.patientName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <button
                    key={c.patientId}
                    type="button"
                    onClick={() => setSelectedPatientId(c.patientId)}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#E7F3EF] border-l-4 border-l-[#126857] shadow-2xs'
                        : 'hover:bg-[#F2F6F4] bg-transparent'
                    }`}
                  >
                    <PatientAvatar
                      gender={c.gender}
                      name={c.patientName}
                      className="h-10 w-10 rounded-full shrink-0 shadow-xs"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-xs font-heading font-bold text-[#10201F]">
                          {c.patientName}
                        </span>
                        {c.nextFollowUp && (
                          <span className="text-[10px] font-mono font-semibold text-[#8C6B1F] bg-[#FDF6E2] px-2 py-0.5 rounded-md border border-[#EBD7A9]">
                            {formatDisplayDate(c.nextFollowUp)}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-[#4E6460] truncate">
                        {c.lastSender === 'PATIENT' ? 'Patient: ' : c.lastSender === 'CLINIC' ? 'You: ' : ''}
                        {c.lastMessage}
                      </p>

                      <div className="mt-1 flex items-center justify-between text-[10px] text-[#7D908C]">
                        <span>{c.contact || 'No phone'}</span>
                        {c.unread && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#25D366] animate-pulse" />
                            New reply
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Window & Composer - Fixed Space with Internal Messages Scroll */}
        <div className="flex-1 min-w-0 flex flex-col h-full bg-white overflow-hidden">
          {activePatient ? (
            <>
              {/* Chat Thread Header */}
              <div className="shrink-0 p-3 sm:p-3.5 border-b border-[#D9E6E2] bg-white flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <PatientAvatar
                    gender={activePatient.gender}
                    name={activePatient.name}
                    className="h-10 w-10 rounded-full shrink-0 shadow-2xs"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-heading font-bold text-[#10201F] truncate">
                        {activePatient.name}
                      </h2>
                      <span className="text-xs text-[#7D908C]">
                        ({activePatient.age ? `${activePatient.age} Y` : ''}
                        {activePatient.age && activePatient.gender ? ' / ' : ''}
                        {activePatient.gender})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#4E6460] mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone size={12} className="text-[#7D908C]" />
                        {activePatient.contact || activePatient.mobile || 'No contact'}
                      </span>
                      {activePatient.nextFollowUp && (
                        <span className="flex items-center gap-1 text-[#287C75]">
                          <Calendar size={12} />
                          Follow-up: {formatDisplayDate(activePatient.nextFollowUp)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/prescription/new?patientId=${encodeURIComponent(activePatient.id)}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9E6E2] bg-white px-3 py-1.5 text-xs font-semibold text-[#10201F] hover:bg-[#F7FAF8] transition"
                  >
                    <FileText size={13} className="text-[#287C75]" />
                    Write Rx
                  </Link>
                  <Link
                    to="/patients"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9E6E2] bg-white px-3 py-1.5 text-xs font-semibold text-[#10201F] hover:bg-[#F7FAF8] transition"
                  >
                    <User size={13} />
                    Profile
                  </Link>
                </div>
              </div>

              {/* Messages Scroll Area - Warm WhatsApp Wall Texture */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-[#EFEAE2]/65">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <MessageCircle size={36} className="text-[#7D908C] opacity-40 mb-2" />
                    <p className="text-sm font-semibold text-[#10201F]">No messages exchanged yet</p>
                    <p className="text-xs text-[#4E6460] max-w-sm mt-1">
                      Start the conversation by choosing a template below or sending a custom message directly to {activePatient.name}.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isClinic = msg.sender === 'CLINIC';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isClinic ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] font-semibold text-[#667781] mb-1 px-1 flex items-center gap-1.5">
                          {isClinic ? (
                            <>
                              <span className="text-[#126857] font-bold">{msg.senderName || 'Gastro Cure Clinic'}</span>
                              {msg.type === 'AUTO_REMINDER' && (
                                <span className="bg-[#126857]/10 text-[#126857] text-[9px] font-semibold px-2 py-0.2 rounded-full border border-[#126857]/20">
                                  Auto-Reminder
                                </span>
                              )}
                              {msg.type === 'AUTO_REPLY' && (
                                <span className="bg-emerald-100 text-emerald-900 text-[9px] font-semibold px-2 py-0.2 rounded-full border border-emerald-300">
                                  Auto-Reply
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="text-[#10201F] font-bold">{msg.senderName} (Patient)</span>
                            </>
                          )}
                        </div>

                        <div
                          className={`max-w-[85%] sm:max-w-[72%] px-4 py-2.5 text-xs whitespace-pre-wrap leading-relaxed ${
                            isClinic
                              ? 'bg-[#126857] text-white rounded-2xl rounded-tr-xs shadow-[0_1px_3px_rgba(18,104,87,0.22)]'
                              : 'bg-white border border-[#E1DDD5] text-[#111B21] rounded-2xl rounded-tl-xs shadow-[0_1px_2px_rgba(11,20,26,0.06)]'
                          }`}
                        >
                          {msg.text}

                          <div
                            className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${
                              isClinic ? 'text-emerald-100/85 font-medium' : 'text-[#667781]'
                            }`}
                          >
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isClinic && <CheckCheck size={14} className="text-[#34B7F1]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Template Chips */}
              <div className="shrink-0 p-2.5 bg-[#FAF9F6] border-t border-[#E5ECE9] flex items-center gap-2 overflow-x-auto text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#637C76] shrink-0 pl-1">
                  Quick Templates:
                </span>
                {quickTemplates.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="shrink-0 rounded-full border border-[#CDE1DA] bg-white hover:bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-[#126857] hover:border-[#126857] transition shadow-2xs cursor-pointer"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>

              {/* Composer Input Bar */}
              <form onSubmit={handleSendMessage} className="shrink-0 p-3 border-t border-[#E5ECE9] bg-[#FAF9F6] flex items-center gap-2.5">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Type a WhatsApp message to ${activePatient.name}...`}
                  className="flex-1 rounded-2xl border border-[#D5DDD9] bg-white px-4 py-2.5 text-xs text-[#111B21] placeholder:text-[#8696A0] focus:border-[#126857] focus:ring-2 focus:ring-[#126857]/15 focus:outline-none transition shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer ${
                    inputText.trim()
                      ? 'bg-[#128C7E] hover:bg-[#075E54]'
                      : 'bg-slate-300 cursor-not-allowed opacity-60'
                  }`}
                  title="Send via WhatsApp"
                >
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#7D908C]">
              <MessageSquare size={42} className="opacity-40 mb-3" />
              <p className="text-sm font-semibold text-[#10201F]">Select a conversation</p>
              <p className="text-xs max-w-xs mt-1">
                Choose a patient on the left panel to review chat history, view WhatsApp responses, or send a manual reply.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

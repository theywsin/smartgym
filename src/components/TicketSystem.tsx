import React, { useState } from "react";
import { 
  MessageSquare, 
  Plus, 
  Send, 
  FolderOpen, 
  Check, 
  AlertCircle, 
  Trash2, 
  Paperclip, 
  Search, 
  Filter, 
  User, 
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";

interface Reply {
  sender: string;
  text: string;
  time: string;
}

interface Ticket {
  id: string;
  memberName: string;
  department: "ACCOUNTING" | "TECHNICAL" | "PUBLIC";
  subject: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "CLOSED" | "ANSWERED";
  date: string;
  replies: Reply[];
}

interface TicketSystemProps {
  isSuperAdmin: boolean;
  isDarkMode: boolean;
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  currentUserLabel: string; // e.g. "باشگاه اکسیژن (مدیر)" or "پشتیبانی اسمارت جیم"
}

export default function TicketSystem({
  isSuperAdmin,
  isDarkMode,
  tickets,
  setTickets,
  currentUserLabel
}: TicketSystemProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create ticket states
  const [newSubject, setNewSubject] = useState("");
  const [newDept, setNewDept] = useState<"ACCOUNTING" | "TECHNICAL" | "PUBLIC">("TECHNICAL");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [newMsg, setNewMsg] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Filter/Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Chat message input
  const [replyInput, setReplyInput] = useState("");

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMsg.trim()) return;

    const newTicket: Ticket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      memberName: currentUserLabel,
      department: newDept,
      subject: newSubject,
      priority: newPriority,
      status: "OPEN",
      date: "1405/04/01",
      replies: [
        { sender: currentUserLabel, text: newMsg, time: "10:15" }
      ]
    };

    setTickets([newTicket, ...tickets]);
    setNewSubject("");
    setNewMsg("");
    setAttachedFile(null);
    setShowCreateModal(false);
    alert(`تیکت جدید با شماره شناسایی ${newTicket.id} با موفقیت ثبت شد و به واحد مربوطه ارجاع گردید.`);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedTicket) return;

    const newReply: Reply = {
      sender: currentUserLabel,
      text: replyInput,
      time: "15:45" // Simulated current time
    };

    // Update status to answered if admin replied, or open if tenant replied
    const updatedStatus = isSuperAdmin ? "ANSWERED" : "OPEN";

    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: updatedStatus,
          replies: [...t.replies, newReply]
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    setSelectedTicket({
      ...selectedTicket,
      status: updatedStatus,
      replies: [...selectedTicket.replies, newReply]
    });
    setReplyInput("");
  };

  const handleCloseTicket = (ticketId: string) => {
    const updated = tickets.map(t => {
      if (t.id === ticketId) return { ...t, status: "CLOSED" as const };
      return t;
    });
    setTickets(updated);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: "CLOSED" });
    }
    alert("تیکت پشتیبانی بسته شد.");
  };

  const handleDeleteTicket = (ticketId: string) => {
    if (confirm("آیا از حذف این تیکت اطمینان دارید؟")) {
      setTickets(tickets.filter(t => t.id !== ticketId));
      setSelectedTicket(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAttachedFile(e.dataTransfer.files[0]);
    }
  };

  // Filter logic
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.memberName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Design Tokens
  const cardBg = isDarkMode ? "bg-slate-900/60 border-white/5 backdrop-blur-md" : "bg-white border-slate-200 shadow-sm";
  const innerCardBg = isDarkMode ? "bg-slate-950/60 border-white/5" : "bg-slate-50 border-slate-200/60";
  const textPrimary = isDarkMode ? "text-slate-100" : "text-slate-800";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  const borderMuted = isDarkMode ? "border-white/5" : "border-slate-100";
  const inputBg = isDarkMode ? "bg-slate-950 border-white/10 text-white" : "bg-white border-slate-300 text-slate-900";

  return (
    <div className="space-y-6 text-xs font-sans">
      
      {/* Search and Filters panel */}
      <div className={`p-4 rounded-2xl border ${cardBg} flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در شناسه، عنوان یا نام..."
              className={`w-64 pl-8 pr-3 py-2 border rounded-xl focus:outline-none focus:border-green-500 ${inputBg}`}
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2">
            <span className={textSecondary}>فیلتر وضعیت:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-1.5 border rounded-xl focus:outline-none ${inputBg}`}
            >
              <option value="ALL">همه تیکت‌ها</option>
              <option value="OPEN">باز (پاسخ داده نشده)</option>
              <option value="ANSWERED">پاسخ داده شده</option>
              <option value="CLOSED">بسته شده</option>
            </select>
          </div>
        </div>

        {!isSuperAdmin && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-500 text-white font-black px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت تیکت جدید پشتیبانی</span>
          </button>
        )}
      </div>

      {/* Main Ticket Dashboard Split Layout */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Tickets List */}
        <div className={`lg:col-span-5 ${cardBg} border rounded-3xl p-4 space-y-3 max-h-[500px] overflow-y-auto`}>
          <span className={`font-bold block mb-1 ${textPrimary}`}>
            {isSuperAdmin ? "لیست کل تیکت‌های پلتفرم" : "تاریخچه تیکت‌های پشتیبانی شما"} ({filteredTickets.length})
          </span>

          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <FolderOpen className="w-10 h-10 mx-auto opacity-35" />
              <p>هیچ تیکت پشتیبانی منطبق بر جستجوی شما یافت نشد.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTickets.map((ticket) => {
                const isSelected = selectedTicket?.id === ticket.id;
                
                const statusStyles = {
                  OPEN: "bg-red-500/10 text-red-400 border-red-500/20",
                  ANSWERED: "bg-green-500/10 text-green-400 border-green-500/20",
                  CLOSED: "bg-slate-500/10 text-slate-400 border-slate-500/20"
                };

                const priorityStyles = {
                  HIGH: "text-red-500 bg-red-500/5",
                  MEDIUM: "text-amber-500 bg-amber-500/5",
                  LOW: "text-slate-400 bg-slate-500/5"
                };

                return (
                  <div 
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-right flex flex-col justify-between ${
                      isSelected 
                        ? "bg-green-500/10 border-green-500/30" 
                        : isDarkMode ? "bg-slate-950/40 border-white/5 hover:bg-white/5" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1 text-right flex-1">
                        <span className="font-mono text-[9px] text-slate-500 block">شناسه: {ticket.id}</span>
                        <h4 className={`font-bold text-xs line-clamp-1 ${textPrimary}`}>{ticket.subject}</h4>
                      </div>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusStyles[ticket.status]}`}>
                        {ticket.status === "OPEN" ? "در انتظار پاسخ" : ticket.status === "ANSWERED" ? "پاسخ داده شده" : "بسته شده"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-white/5 text-[9px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{ticket.memberName}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.5 rounded ${priorityStyles[ticket.priority]}`}>اولویت {ticket.priority === "HIGH" ? "فوری" : ticket.priority === "MEDIUM" ? "متوسط" : "کم"}</span>
                      </div>
                      <span className="font-mono">{ticket.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Conversation Panel */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className={`${cardBg} border rounded-3xl p-5 space-y-4 flex flex-col justify-between`}>
              
              {/* Ticket header details */}
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div>
                  <span className="text-[9px] text-slate-500 font-mono">تیکت فعال: {selectedTicket.id}</span>
                  <h3 className={`text-sm font-black ${textPrimary}`}>{selectedTicket.subject}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">ارسال کننده: {selectedTicket.memberName} | دپارتمان: {selectedTicket.department}</p>
                </div>

                <div className="flex gap-2">
                  {selectedTicket.status !== "CLOSED" && (
                    <button 
                      onClick={() => handleCloseTicket(selectedTicket.id)}
                      className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border border-amber-500/20 px-2.5 py-1.5 rounded-xl font-bold transition-all text-[10px]"
                    >
                      بستن تیکت
                    </button>
                  )}
                  {isSuperAdmin && (
                    <button 
                      onClick={() => handleDeleteTicket(selectedTicket.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 p-1.5 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Thread */}
              <div className="bg-slate-950/50 rounded-2xl border border-white/5 p-4 h-[280px] overflow-y-auto space-y-4 text-right flex flex-col">
                {selectedTicket.replies.map((rep, idx) => {
                  const isAdminReply = rep.sender.includes("پشتیبانی") || rep.sender.includes("ادمین");
                  return (
                    <div 
                      key={idx}
                      className={`max-w-[80%] rounded-2xl p-3 leading-relaxed flex flex-col ${
                        isAdminReply 
                          ? "bg-green-600 text-white self-start" 
                          : "bg-white/5 text-slate-300 border border-white/5 self-end"
                      }`}
                    >
                      <span className="text-[8px] opacity-80 font-bold mb-1 block">{rep.sender}</span>
                      <span>{rep.text}</span>
                      <span className="text-[8px] opacity-60 self-end mt-1 font-mono">{rep.time}</span>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              {selectedTicket.status === "CLOSED" ? (
                <div className="bg-slate-500/5 text-slate-400 p-3 rounded-2xl text-center border border-white/5">
                  🔐 این تیکت بسته شده است و امکان ارسال پاسخ جدید وجود ندارد.
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="flex gap-2 items-center">
                  <input 
                    type="text"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    placeholder="پیام خود را بنویسید..."
                    className={`flex-1 px-4 py-2.5 rounded-xl focus:outline-none focus:border-green-500 ${inputBg}`}
                    required
                  />
                  <button 
                    type="submit"
                    className="bg-green-600 hover:bg-green-500 text-white p-2.5 rounded-xl transition-all shrink-0"
                  >
                    <Send className="w-4.5 h-4.5" />
                  </button>
                </form>
              )}

            </div>
          ) : (
            <div className={`${cardBg} border rounded-3xl p-12 text-center text-slate-500 space-y-3`}>
              <MessageSquare className="w-12 h-12 mx-auto opacity-25" />
              <p className="font-bold">تیکتی انتخاب نشده است</p>
              <p className="text-[10px]">برای مشاهده تاریخچه گفتگو و پاسخگویی، یک تیکت از لیست سمت راست انتخاب کنید.</p>
            </div>
          )}
        </div>

      </div>

      {/* ================= CREATE TICKET MODAL ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-right">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-lg w-full space-y-5 relative">
            <h3 className="text-base font-black text-white border-b border-white/5 pb-2.5">ایجاد تیکت پشتیبانی جدید</h3>
            
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">موضوع تیکت</label>
                <input 
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="مثال: مشکل در بارگذاری آیکون وایت‌لیبل"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-green-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">دپارتمان مربوطه</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="TECHNICAL">فنی و کلاود</option>
                    <option value="ACCOUNTING">مالی و فاکتورها</option>
                    <option value="PUBLIC">عمومی و اشتراک</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">اولویت تیکت</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="LOW">کم</option>
                    <option value="MEDIUM">متوسط (معمولی)</option>
                    <option value="HIGH">فوری (بحرانی)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">متن پیام تفصیلی</label>
                <textarea 
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  rows={4}
                  placeholder="مشکل خود را به صورت کامل شرح دهید تا ادمین فنی بلافاصله بررسی کند..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-green-500 text-xs"
                  required
                ></textarea>
              </div>

              {/* Drag and Drop Mock File uploader */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                  isDragOver 
                    ? "border-green-500 bg-green-500/10 text-green-400" 
                    : attachedFile ? "border-green-500/50 bg-green-500/5 text-slate-300" : "border-white/10 text-slate-500"
                }`}
              >
                <Paperclip className="w-6 h-6 mx-auto mb-1.5 opacity-60" />
                {attachedFile ? (
                  <span className="font-bold text-xs text-green-400 block">فایل ضمیمه شد: {attachedFile.name} ({(attachedFile.size / 1024).toFixed(1)} KB)</span>
                ) : (
                  <div>
                    <span className="font-bold block text-[10px]">فایل پیوست یا تصویر خطا را اینجا رها کنید (Drag & Drop)</span>
                    <span className="text-[9px] opacity-75 mt-0.5 block">یا برای انتخاب کلیک کنید</span>
                  </div>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => { if (e.target.files && e.target.files[0]) setAttachedFile(e.target.files[0]); }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black py-2.5 rounded-xl transition-all text-xs"
                >
                  ارسال و ارجاع فوری تیکت
                </button>
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-white/10 hover:bg-white/15 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
                >
                  بستن
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

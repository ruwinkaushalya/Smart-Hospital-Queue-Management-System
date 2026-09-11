import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle, X, Send, Bot, User, Sparkles,
  ChevronRight, LayoutDashboard, AlertTriangle,
  UserPlus, Truck, BedDouble
} from 'lucide-react';

const knowledgeBase = {
  greeting: [
    "Hello! I'm your Smart Hospital AI Assistant. I can help you with questions about the hospital queue management system. What would you like to know?",
    "Hi there! I'm here to help you navigate the Smart Hospital Queue Management System. Ask me anything about the features!",
    "Welcome! I'm your AI assistant for the hospital queue system. How can I help you today?",
  ],
  dashboard: {
    keywords: ['dashboard', 'overview', 'home', 'main page', 'system dashboard'],
    response: `The **Dashboard** gives you a real-time overview of the entire hospital queue system. Here's what you can see:

• **Stat Cards**: Emergency patients, normal patients, treated count, average wait time, queue status, available ambulances, active hospitals, and throughput rate.
• **Top Priority Patients**: A table showing the highest-priority waiting patients with their AI scores.
• **Quick Actions**: Process next patient, simulate emergency, refresh queue, and clear data.
• **Recently Treated**: Patients who have completed treatment today.

The dashboard auto-refreshes every 5 seconds to keep data live.`,
  },
  emergency: {
    keywords: ['emergency', 'critical', 'high priority', 'urgent', 'emergency queue'],
    response: `The **Emergency Queue** handles CRITICAL and HIGH severity patients using a **Min-Heap Priority Queue** for O(log n) insertions.

Key features:
• **Priority-based sorting**: Patients ranked by AI score (highest first)
• **Search & Filter**: Find patients by name, ID, or symptoms
• **Severity filtering**: View only Critical or High patients
• **Sort options**: AI Priority, Wait Time, Name, or Age
• **Visual indicators**: Rank badges (1st = red, 2nd = orange, 3rd = amber)
• **AI Score bar**: Visual progress bar showing each patient's AI priority score

Emergency patients are processed before normal patients automatically.`,
  },
  normal: {
    keywords: ['normal queue', 'fifo', 'moderate', 'low', 'routine', 'standard queue'],
    response: `The **Normal Queue** handles MODERATE, LOW, and ROUTINE patients using a **Circular Queue** for O(1) enqueue/dequeue operations.

Key features:
• **FIFO ordering**: First-come-first-served by default
• **Search & Filter**: Find patients by name, ID, or symptoms
• **Severity filtering**: Filter by Moderate, Low, or Routine
• **Sort options**: FIFO (registration order), Wait Time, Name, or Age
• **Position badges**: Shows queue position number for each patient
• **AI Score**: Visual bar showing priority even for normal patients

This queue ensures fair processing for non-critical cases.`,
  },
  registration: {
    keywords: ['register', 'registration', 'new patient', 'add patient', 'form', 'sign up'],
    response: `The **Patient Registration** page lets you register new patients with AI-assisted severity assessment.

Features:
• **Patient Details**: Name, Age, Contact, Symptoms, and Severity Level
• **AI Analyze Symptoms**: Click the AI button to get automatic severity recommendations based on symptoms
• **Severity Guide**: Visual guide showing what each severity level means
• **AI Insights**: After analysis, see suggested severity, predicted wait time, confidence %, and queue position
• **Form validation**: Required fields with real-time error messages
• **Accessibility**: Proper labels, ARIA attributes, and autocomplete support

The AI considers symptoms (chest pain, breathing issues = CRITICAL), age (patients > 65 get upgraded priority), and current hospital load.`,
  },
  treatment: {
    keywords: ['treatment', 'process', 'doctor', 'bed', 'assign', 'treat patient'],
    response: `The **Treatment & Processing** page lets doctors and staff process waiting patients.

Features:
• **Waiting List**: All patients with "Process" button
• **Assign Doctor**: Choose from 5 available doctors (Dr. Silva, Dr. Fernando, Dr. Perera, Dr. Jayasinghe, Dr. Bandara)
• **Assign Hospital**: Select from available hospitals
• **Bed Assignment**: General Ward beds, ICU beds, or Emergency Room
• **Treatment Notes**: Document treatment details
• **Treatment History**: Complete log of all treated patients with timestamps
• **Stats**: Waiting count, completed today, critical waiting, beds available

Click "Process" on any patient to open the assignment panel and complete treatment.`,
  },
  bed: {
    keywords: ['bed', 'icu', 'bed management', 'allocate', 'discharge', 'hospital beds', 'occupancy'],
    response: `The **Bed & ICU Management** page shows real-time bed availability across all hospitals.

Features:
• **Bed Grid**: Visual layout showing each bed (General Ward = white, ICU = red tint, Occupied = amber, Available = green)
• **Hospital Selector**: Switch between hospitals to see their bed layouts
• **Filter**: Show All, General Ward only, or ICU only
• **Occupancy Stats**: Total beds, available beds, total ICU, available ICU
• **Occupancy Bars**: Visual progress bars showing each hospital's load percentage
• **Quick Actions**:
  - **Allocate New Bed**: Add a patient to a General or ICU bed
  - **Discharge Patient**: Free up a bed when treatment is complete
  - **Emergency ICU Request**: Instantly add a critical patient to ICU

Beds are color-coded: green = available, red = occupied.`,
  },
  dispatch: {
    keywords: ['ambulance', 'dispatch', 'dijkstra', 'shortest path', 'routing', 'hospital network', 'transport'],
    response: `The **Ambulance Dispatch & Hospital Network** page uses **Dijkstra's Algorithm** for optimal routing.

Features:
• **Hospital Network Table**: View all hospitals with bed counts, ICU, doctors, and emergency unit status
• **Road Connections**: Shows all road connections between hospitals with distances
• **Shortest Path Calculator**: Select "From" and "To" hospitals, then click "Calculate Shortest Path" to see:
  - The optimal route (node sequence)
  - Total distance in km
  - Estimated travel time in minutes
• **Active Ambulances**: Real-time table of all ambulances with driver, status, patient, destination, distance, and ETA
• **Quick Dispatch**:
  - **Emergency Dispatch**: Send ambulance for critical patients (red button)
  - **Transport Dispatch**: Send ambulance for non-critical transport (blue button)

The Dijkstra algorithm runs in O(E log V) time for fast path finding.`,
  },
  analytics: {
    keywords: ['analytics', 'charts', 'graphs', 'statistics', 'ai analytics', 'insights', 'reports', 'data'],
    response: `The **AI Analytics & Insights** page provides real-time charts and AI-powered recommendations.

Tabs:
• **Overview**: Queue performance metrics (waiting, critical, treated, avg wait time) + AI insights and warnings
• **Severity**: Pie chart and bar chart showing patient severity distribution
• **Volume**: Hourly patient volume chart (emergency vs normal)
• **AI Prediction**: Line chart comparing actual vs predicted wait times + prediction accuracy (87%), error rate (±4.2 min), and trend (-12% reduction)
• **Hospitals**: Load and capacity table for each hospital with visual load bars

You can also **Export Data** as JSON for external analysis.`,
  },
  map: {
    keywords: ['map', '3d', 'hospital map', '3d view', 'network map', 'dispatch simulation', 'location'],
    response: `The **3D Hospital Network Map** provides an interactive 3D visualization of the hospital network.

Features:
• **3D Scene**: Interactive 3D view with hospital buildings, road connections, and ambulances
• **Click Interactions**: Click any hospital or ambulance to see detailed info
• **Hospital Info Panel**: Name, ID, address, beds, ICU, doctors, emergency unit, load %
• **Ambulance Info Panel**: Driver, status, contact, patient, destination, distance, ETA
• **Controls**: Drag to rotate, scroll to zoom, right-click to pan
• **Legend**: Color-coded indicators for emergency hospitals, general hospitals, available ambulances, and active ambulances
• **Reset View**: Button to reset the camera

The 3D scene is built with Three.js for realistic visualization.`,
  },
  notifications: {
    keywords: ['notification', 'alert', 'bell', 'history', 'events', 'notifications center'],
    response: `The **Notifications Center** shows all system alerts and events.

Features:
• **Real-time Notifications**: Live alerts when critical patients are registered
• **Notification History**: Past events including:
  - Critical patient registrations
  - Ambulance dispatches
  - Queue alerts
  - New patient registrations
  - Bed availability changes
  - Treatment completions
  - System events
• **Filtering**: Filter by All, Unread, Critical, Dispatch, Queue, or Beds
• **Unread Counter**: Badge showing number of unread notifications
• **Actions**: Mark All Read, Clear History, or dismiss individual notifications
• **Color Coding**: Each notification type has its own color (red = critical, cyan = dispatch, amber = queue, etc.)

Live notifications show a "LIVE" badge with a pulse animation.`,
  },
  help: {
    keywords: ['help', 'how to', 'what is', 'how do i', 'how can i', 'guide', 'tutorial', 'instructions'],
    response: `I can help you with any questions about the Smart Hospital Queue Management System! Here are some things you can ask:

**About Pages:**
• "What is the Dashboard?" — Overview of the main page
• "How does the Emergency Queue work?" — Priority queue system
• "What is the Normal Queue?" — FIFO queue system
• "How do I register a patient?" — Registration process
• "How does Treatment work?" — Processing patients
• "What is Bed Management?" — Bed allocation system
• "How does Dispatch work?" — Ambulance routing
• "What are Analytics?" — Charts and AI insights
• "What is the 3D Map?" — Interactive map view
• "How do Notifications work?" — Alert system

**About the System:**
• "What algorithms are used?" — Min-Heap, Circular Queue, Dijkstra's
• "How does AI work?" — Symptom analysis and severity prediction
• "What is the severity scale?" — Critical, High, Moderate, Low, Routine

Just ask me anything!`,
  },
  algorithms: {
    keywords: ['algorithm', 'data structure', 'min heap', 'circular queue', 'dijkstra', 'priority queue', 'tech stack'],
    response: `The Smart Hospital Queue Management System uses advanced data structures and algorithms:

• **Min-Heap Priority Queue** — For emergency patients (CRITICAL/HIGH). Insertions are O(log n), and the highest priority patient is always at the top for O(1) access.

• **Circular Queue** — For normal patients (MODERATE/LOW/ROUTINE). Provides O(1) enqueue and dequeue operations with efficient memory reuse.

• **Dijkstra's Algorithm** — For ambulance dispatch routing. Finds the shortest path between hospitals in O(E log V) time using a graph representation of the hospital network.

• **AI Decision Support** — Rule-based symptom analysis that considers keywords (chest pain = CRITICAL, fever = MODERATE), patient age (>65 gets priority boost), and current hospital load.

• **Real-time Updates** — All pages auto-refresh every 5 seconds using React hooks for live data.

The backend is built in Java with a REST API server.`,
  },
  severity: {
    keywords: ['severity', 'priority', 'critical', 'high', 'moderate', 'low', 'routine', 'classification'],
    response: `The system uses a 5-level severity classification:

🔴 **CRITICAL** — Life-threatening conditions (chest pain, breathing difficulty, heart attack)
• AI wait time: ~5 minutes
• Automatic top priority in emergency queue

🟠 **HIGH** — Severe injuries/conditions (accidents, broken bones, severe bleeding)
• AI wait time: ~15 minutes
• High priority in emergency queue

🔵 **MODERATE** — Urgent but stable (fever, pain, dehydration)
• AI wait time: ~35 minutes
• Normal queue with moderate priority

🟢 **LOW** — Minor issues (migraine, dizziness, sprain)
• AI wait time: ~55 minutes
• Normal queue, lower priority

⚪ **ROUTINE** — Check-ups, follow-ups, minor concerns
• AI wait time: ~60 minutes
• Normal queue, lowest priority

The AI automatically suggests severity based on symptoms, and patients over 65 get an automatic priority boost.`,
  },
  default: [
    "I'm not sure I understand. Could you rephrase that? I can help with questions about the Dashboard, Emergency Queue, Normal Queue, Registration, Treatment, Bed Management, Dispatch, Analytics, 3D Map, or Notifications.",
    "Hmm, I don't have information about that yet. Try asking about a specific page like 'What is the Dashboard?' or 'How does Bed Management work?'",
    "I'm here to help with the hospital queue system! Ask me about any page or feature. Try 'help' to see what I can answer.",
  ],
};

const quickQuestions = [
  { label: 'What is the Dashboard?', icon: LayoutDashboard, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'How does Emergency Queue work?', icon: AlertTriangle, color: 'bg-red-50 text-red-700 border-red-200' },
  { label: 'How do I register a patient?', icon: UserPlus, color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { label: 'How does Dispatch work?', icon: Truck, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'What is Bed Management?', icon: BedDouble, color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { label: 'What algorithms are used?', icon: Sparkles, color: 'bg-violet-50 text-violet-700 border-violet-200' },
];

function formatResponse(text) {
  // Convert markdown-style bold to JSX
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-slate-800">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const greetingTimeoutRef = useRef(null);
  const fallbackCounterRef = useRef(0);

  const findResponse = (text) => {
    const lower = text.toLowerCase();

    if (lower.includes('help') || lower.includes('what can you') || lower.includes('what do you do')) {
      return knowledgeBase.help.response;
    }

    for (const [key, data] of Object.entries(knowledgeBase)) {
      if (key === 'greeting' || key === 'default' || key === 'help') continue;
      if (data.keywords && data.keywords.some(k => lower.includes(k))) {
        return data.response;
      }
    }

    // Cycle through default responses
    const defaults = knowledgeBase.default;
    const idx = fallbackCounterRef.current % defaults.length;
    fallbackCounterRef.current += 1;
    return defaults[idx];
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Escape key to close chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (greetingTimeoutRef.current) clearTimeout(greetingTimeoutRef.current);
    };
  }, []);

  const openChat = () => {
    setIsOpen(true);
    if (!hasStarted) {
      setHasStarted(true);
      const greetings = knowledgeBase.greeting;
      const greeting = greetings[greetings.length - 1];
      setIsTyping(true);
      greetingTimeoutRef.current = setTimeout(() => {
        setMessages([{ type: 'bot', text: greeting, time: new Date() }]);
        setIsTyping(false);
      }, 800);
    }
  };

  const sendMessage = (text) => {
    if (!text.trim()) return;

    const userMsg = { type: 'user', text: text.trim(), time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    const delay = 800 + ((messages.length * 137) % 600);
    typingTimeoutRef.current = setTimeout(() => {
      const response = findResponse(text.trim());
      const botMsg = { type: 'bot', text: response, time: new Date() };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, delay);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickQuestion = (question) => {
    sendMessage(question);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => isOpen ? setIsOpen(false) : openChat()}
        className={`fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-xl shadow-cyan-200/50 flex items-center justify-center transition-all duration-300 cursor-pointer ${
          isOpen
            ? 'bg-slate-700 hover:bg-slate-800 rotate-0'
            : 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 hover:scale-110 hover:shadow-2xl hover:shadow-cyan-300/60'
        }`}
        aria-label={isOpen ? 'Close chat' : 'Open AI chatbot'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Smart Hospital AI Chatbot"
          className="fixed bottom-24 right-5 z-50 w-[380px] max-w-[calc(100vw-40px)] h-[520px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl shadow-slate-300/40 border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white">Smart Hospital AI</h3>
              <p className="text-[11px] text-cyan-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online — Ask me anything
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer"
              aria-label="Close chat"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" aria-live="polite" aria-atomic="false" aria-relevant="additions">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-8">
                <Bot className="w-10 h-10 mb-3 text-slate-300" />
                <p className="text-sm">Your AI assistant is ready!</p>
                <p className="text-xs mt-1">Select a quick question below or type your own.</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${
                  msg.type === 'user'
                    ? 'bg-cyan-100'
                    : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                }`}>
                  {msg.type === 'user' ? (
                    <User className="w-3.5 h-3.5 text-cyan-700" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <div className={`max-w-[85%] px-3 py-2.5 rounded-xl text-sm leading-relaxed ${
                  msg.type === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-700 rounded-bl-sm border border-slate-200'
                }`}>
                  <div className="whitespace-pre-wrap">{formatResponse(msg.text)}</div>
                  <span className={`text-[10px] mt-1 block ${
                    msg.type === 'user' ? 'text-cyan-200' : 'text-slate-400'
                  }`}>
                    {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2" aria-live="polite" aria-label="AI is typing">
                <div className="w-7 h-7 rounded-full shrink-0 bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-slate-100 text-slate-700 px-4 py-3 rounded-xl rounded-bl-sm border border-slate-200">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 2 && !isTyping && (
            <div className="px-4 pb-2 shrink-0">
              <p className="text-[11px] text-slate-400 mb-2 font-medium">Quick questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {quickQuestions.map((q, i) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleQuickQuestion(q.label)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all hover:scale-105 cursor-pointer ${q.color}`}
                    >
                      <Icon className="w-3 h-3" />
                      {q.label}
                      <ChevronRight className="w-3 h-3 opacity-50" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-slate-200 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the hospital system..."
                aria-label="Ask a question about the hospital system"
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-cyan-200/50 hover:shadow-lg hover:shadow-cyan-300/60"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

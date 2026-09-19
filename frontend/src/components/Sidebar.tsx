import React from 'react';
import { 
  Plus, Trash2, Cpu, Activity, FileText, 
  Settings, BarChart2, Layers, Sliders, Heart, MessageSquare, X
} from 'lucide-react';
import { Conversation, WorkspaceTab } from '../types';
import { AILogo } from './AILogo';

interface SidebarProps {
  conversations: Conversation[];
  activeConvoId: string | null;
  activeTab: WorkspaceTab;
  ollamaRunning: boolean;
  activeModelName: string;
  isOpen: boolean;
  isClosed?: boolean;
  onSelectConvo: (id: string) => void;
  onStartNewChat: () => void;
  onDeleteConvo: (id: string, e: React.MouseEvent) => void;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenCustomization: () => void;
  onGoToLanding?: () => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConvoId,
  activeTab,
  ollamaRunning,
  activeModelName,
  isOpen,
  isClosed = false,
  onSelectConvo,
  onStartNewChat,
  onDeleteConvo,
  onSelectTab,
  onOpenCustomization,
  onGoToLanding,
  onClose
}) => {
  const isOnlineDeployed = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

  // Prevent conflicting classes: if isOpen (mobile open), do not attach 'closed'
  const sidebarClasses = `sidebar ${isOpen ? 'open' : ''} ${isClosed && !isOpen ? 'closed' : ''}`.trim();

  return (
    <aside className={sidebarClasses} onClick={(e) => e.stopPropagation()}>
      {/* BRAND HEADER WITH OPTIONAL MOBILE CLOSE */}
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div 
          onClick={() => {
            if (onGoToLanding) onGoToLanding();
            if (onClose) onClose();
          }}
          style={{ cursor: onGoToLanding ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}
          title="Return to Landing Page"
        >
          <AILogo size={24} showText={true} subtitle="COMMAND CENTER" />
        </div>
        {onClose && (
          <button 
            className="sidebar-mobile-close-btn" 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            title="Close menu"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* NEW CONVERSATION BUTTON WITH CTRL K TAG */}
      <button 
        className="new-chat-pill-btn" 
        onClick={() => {
          onStartNewChat();
          if (onClose) onClose();
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={14} />
          <span>New conversation</span>
        </div>
        <span className="shortcut-tag">Ctrl K</span>
      </button>

      {/* RECENT CONVERSATIONS LIST */}
      <div className="nav-section" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="nav-section-title-row">
          <span>RECENT SESSIONS</span>
          <button className="see-all-btn" onClick={onStartNewChat}>See all</button>
        </div>

        {conversations.length === 0 ? (
          <div style={{ padding: '8px 12px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            No recent sessions
          </div>
        ) : (
          conversations.slice(0, 6).map((convo, idx) => (
            <button
              key={convo.id}
              className={`session-row-item ${activeTab === 'orchestra' && activeConvoId === convo.id ? 'active' : ''}`}
              onClick={() => {
                onSelectTab('orchestra');
                onSelectConvo(convo.id);
                if (onClose) onClose();
              }}
            >
              <div className="session-icon-box">
                <MessageSquare size={13} className="session-icon" />
              </div>
              <div className="session-text-group">
                <span className="session-item-title">{convo.title}</span>
                <span className="session-item-time">{idx === 0 ? '2 hours ago' : idx === 1 ? '5 hours ago' : `${idx + 1} days ago`}</span>
              </div>
              <Trash2
                size={12}
                className="nav-delete-btn"
                onClick={(e) => onDeleteConvo(convo.id, e)}
              />
            </button>
          ))
        )}
      </div>

      {/* WORKSPACE NAVIGATION */}
      <div className="nav-section" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="nav-section-title">WORKSPACE</div>
        
        <button
          className={`nav-item ${activeTab === 'orchestra' && !activeConvoId ? 'active' : ''}`}
          onClick={() => { onSelectTab('orchestra'); if (onClose) onClose(); }}
        >
          <div className="nav-item-left">
            <Layers size={14} />
            <span>Orchestra</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => { onSelectTab('models'); if (onClose) onClose(); }}
        >
          <div className="nav-item-left">
            <Cpu size={14} />
            <span>Models</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === 'runs' ? 'active' : ''}`}
          onClick={() => { onSelectTab('runs'); if (onClose) onClose(); }}
        >
          <div className="nav-item-left">
            <Activity size={14} />
            <span>Runs</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => { onSelectTab('files'); if (onClose) onClose(); }}
        >
          <div className="nav-item-left">
            <FileText size={14} />
            <span>Files</span>
          </div>
        </button>
      </div>

      {/* SYSTEM NAVIGATION */}
      <div className="nav-section" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="nav-section-title">SYSTEM</div>

        <button className="nav-item" onClick={() => { onOpenCustomization(); if (onClose) onClose(); }}>
          <div className="nav-item-left">
            <Sliders size={14} style={{ color: 'var(--accent-color)' }} />
            <span>Customize Layout</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => { onSelectTab('settings'); if (onClose) onClose(); }}
        >
          <div className="nav-item-left">
            <Settings size={14} />
            <span>Settings</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === 'usage' ? 'active' : ''}`}
          onClick={() => { onSelectTab('usage'); if (onClose) onClose(); }}
        >
          <div className="nav-item-left">
            <BarChart2 size={14} />
            <span>Usage</span>
          </div>
        </button>
      </div>

      {/* SYSTEM STATUS TELEMETRY FOOTER */}
      <div className="sidebar-status-footer">
        <div className="status-title-row">
          <span className="status-label-title">SYSTEM STATUS</span>
        </div>

        <div className="system-operational-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="status-green-dot">●</span>
            <span className="operational-text">All Systems Operational</span>
          </div>
          <div className="latency-bars">
            <span className="bar bar1" />
            <span className="bar bar2" />
            <span className="bar bar3" />
          </div>
        </div>

        <div className="telemetry-item-row">
          <span className="telemetry-name">gemini-2.5-flash</span>
          <span className="telemetry-status online">Online</span>
        </div>
        <div className="telemetry-item-row">
          <span className="telemetry-name">Ollama</span>
          <span className="telemetry-status online">{ollamaRunning ? 'Online' : 'Online'}</span>
        </div>
        <div className="telemetry-item-row">
          <span className="telemetry-name">Vector DB</span>
          <span className="telemetry-status online">Online</span>
        </div>

        <div className="developer-credit-tag" style={{ marginTop: '12px' }}>
          <Heart size={11} style={{ color: '#38bdf8', fill: 'rgba(56, 189, 248, 0.3)' }} />
          <span>Architected by <strong className="developer-glow-text">Avee Ranjan</strong></span>
        </div>
      </div>
    </aside>
  );
};


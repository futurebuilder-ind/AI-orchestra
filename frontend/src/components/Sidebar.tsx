import React from 'react';
import { 
  Plus, Trash2, Cpu, Activity, FileText, 
  Settings, BarChart2, Layers, Sliders, ShieldCheck, Heart
} from 'lucide-react';
import { Conversation, WorkspaceTab } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConvoId: string | null;
  activeTab: WorkspaceTab;
  ollamaRunning: boolean;
  activeModelName: string;
  isOpen: boolean;
  onSelectConvo: (id: string) => void;
  onStartNewChat: () => void;
  onDeleteConvo: (id: string, e: React.MouseEvent) => void;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenCustomization: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConvoId,
  activeTab,
  ollamaRunning,
  activeModelName,
  isOpen,
  onSelectConvo,
  onStartNewChat,
  onDeleteConvo,
  onSelectTab,
  onOpenCustomization
}) => {
  const isOnlineDeployed = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* BRAND HEADER */}
      <div className="sidebar-header">
        <div className="brand-title">
          <span>AI ORCHESTRA</span>
          <span className={`brand-title-badge ${isOnlineDeployed ? 'cloud' : 'local'}`}>
            {isOnlineDeployed ? 'CLOUD' : 'LOCAL'}
          </span>
        </div>
      </div>

      {/* NEW CONVERSATION BUTTON */}
      <button className="new-chat-btn" onClick={onStartNewChat}>
        <Plus size={14} />
        <span>New conversation</span>
      </button>

      {/* RECENT CONVERSATIONS */}
      <div className="nav-section" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="nav-section-title">RECENT SESSIONS</div>
        {conversations.length === 0 ? (
          <div style={{ padding: '8px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            No recent sessions
          </div>
        ) : (
          conversations.map((convo) => (
            <button
              key={convo.id}
              className={`nav-item ${activeTab === 'orchestra' && activeConvoId === convo.id ? 'active' : ''}`}
              onClick={() => {
                onSelectTab('orchestra');
                onSelectConvo(convo.id);
              }}
            >
              <div className="nav-item-left">
                <span className="nav-item-title">{convo.title}</span>
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
      <div className="nav-section" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="nav-section-title">WORKSPACE</div>
        
        <button
          className={`nav-item ${activeTab === 'orchestra' && !activeConvoId ? 'active' : ''}`}
          onClick={() => onSelectTab('orchestra')}
        >
          <div className="nav-item-left">
            <Layers size={14} />
            <span>Orchestra</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => onSelectTab('models')}
        >
          <div className="nav-item-left">
            <Cpu size={14} />
            <span>Models</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === 'runs' ? 'active' : ''}`}
          onClick={() => onSelectTab('runs')}
        >
          <div className="nav-item-left">
            <Activity size={14} />
            <span>Runs</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => onSelectTab('files')}
        >
          <div className="nav-item-left">
            <FileText size={14} />
            <span>Files</span>
          </div>
        </button>
      </div>

      {/* SYSTEM NAVIGATION */}
      <div className="nav-section" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="nav-section-title">SYSTEM</div>

        <button className="nav-item" onClick={onOpenCustomization}>
          <div className="nav-item-left">
            <Sliders size={14} style={{ color: 'var(--accent-color)' }} />
            <span>Customize Layout</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab('settings')}
        >
          <div className="nav-item-left">
            <Settings size={14} />
            <span>Settings</span>
          </div>
        </button>

        <button
          className={`nav-item ${activeTab === 'usage' ? 'active' : ''}`}
          onClick={() => onSelectTab('usage')}
        >
          <div className="nav-item-left">
            <BarChart2 size={14} />
            <span>Usage</span>
          </div>
        </button>
      </div>

      {/* FOOTER STATUS & DEVELOPER BADGE */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>SYSTEM STATUS</span>
          <span className="status-badge-inline">
            {isOnlineDeployed ? '● CLOUD ONLINE' : '● SYSTEM READY'}
          </span>
        </div>

        <div className="agent-status-tag">
          <span>●</span>
          <span>{activeModelName} • {ollamaRunning ? 'Ollama Ready' : 'Ollama Offline'}</span>
        </div>

        {/* DEVELOPER CREDIT WITH BREATHING GLOW */}
        <div className="developer-credit-tag">
          <Heart size={11} style={{ color: 'var(--accent-color)', fill: 'rgba(var(--accent-rgb), 0.3)' }} />
          <span>Architected by <strong className="developer-glow-text">Avee Ranjan</strong></span>
        </div>
      </div>
    </aside>
  );
};

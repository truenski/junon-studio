import { useState } from "react";
import { Code2, BookOpen, Boxes, Settings, Zap, ExternalLink } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import { Documentation } from "@/components/Documentation";
import { SnippetsGallery } from "@/components/SnippetsGallery";
import { SettingsModal } from "@/components/SettingsModal";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";

type Tab = "editor" | "docs" | "snippets";

const tabs: { id: Tab; label: string; icon: typeof Code2 }[] = [
  { id: "editor", label: "Editor", icon: Code2 },
  { id: "docs", label: "Documentation", icon: BookOpen },
  { id: "snippets", label: "Snippets", icon: Boxes },
];

// Quick docs for collapsed panel
const quickDocs = [
  { name: "@trigger", desc: "Event handlers" },
  { name: "@command", desc: "Custom commands" },
  { name: "@event", desc: "Game events" },
  { name: "sendMessage()", desc: "Send chat message" },
  { name: "giveItem()", desc: "Give item to player" },
  { name: "teleport()", desc: "Move player" },
];

// Quick snippets for collapsed panel
const quickSnippets = [
  { name: "Spawn System", lines: 12 },
  { name: "Kill Streak", lines: 18 },
  { name: "Safe Zones", lines: 14 },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("editor");
  const [showSettings, setShowSettings] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="h-14 border-b border-border/50 glass-panel flex items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-display text-primary neon-glow leading-none">
              JUNON<span className="text-secondary">CODE</span>
            </h1>
            <p className="text-[10px] text-muted-foreground font-ui uppercase tracking-widest">Builder</p>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-ui text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary neon-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a
            href="https://junon.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <span className="hidden sm:inline">junon.io</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === "editor" && (
          <>
            {/* Left Collapsible Panel - Quick Docs */}
            <CollapsiblePanel
              title="Quick Docs"
              isOpen={leftPanelOpen}
              onToggle={() => setLeftPanelOpen(!leftPanelOpen)}
              side="left"
            >
              <div className="space-y-2">
                {quickDocs.map((doc, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors group"
                  >
                    <span className="text-xs font-mono text-primary group-hover:neon-glow">
                      {doc.name}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{doc.desc}</p>
                  </div>
                ))}
                <button
                  onClick={() => setActiveTab("docs")}
                  className="w-full text-xs text-center py-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  View all docs →
                </button>
              </div>
            </CollapsiblePanel>

            {/* Code Editor */}
            <div className="flex-1 overflow-hidden">
              <CodeEditor />
            </div>

            {/* Right Collapsible Panel - Quick Snippets */}
            <CollapsiblePanel
              title="Snippets"
              isOpen={rightPanelOpen}
              onToggle={() => setRightPanelOpen(!rightPanelOpen)}
              side="right"
            >
              <div className="space-y-2">
                {quickSnippets.map((snippet, i) => (
                  <div
                    key={i}
                    className="p-2 rounded bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors group"
                  >
                    <span className="text-xs font-ui text-foreground group-hover:text-secondary">
                      {snippet.name}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{snippet.lines} lines</p>
                  </div>
                ))}
                <button
                  onClick={() => setActiveTab("snippets")}
                  className="w-full text-xs text-center py-2 text-muted-foreground hover:text-secondary transition-colors"
                >
                  Browse gallery →
                </button>
              </div>
            </CollapsiblePanel>
          </>
        )}

        {activeTab === "docs" && <Documentation />}
        {activeTab === "snippets" && <SnippetsGallery />}
      </main>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

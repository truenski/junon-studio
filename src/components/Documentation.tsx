import { useState } from "react";
import { ChevronRight, Zap, Target, Variable, Command, Boxes, Search } from "lucide-react";

const categories = [
  { id: "triggers", name: "Triggers", icon: Zap, color: "text-secondary" },
  { id: "commands", name: "Commands", icon: Command, color: "text-primary" },
  { id: "events", name: "Events", icon: Target, color: "text-accent" },
  { id: "variables", name: "Variables", icon: Variable, color: "text-neon-purple" },
  { id: "objects", name: "Objects", icon: Boxes, color: "text-neon-orange" },
];

const docs: Record<string, { title: string; description: string; syntax: string; example: string }[]> = {
  triggers: [
    {
      title: "onPlayerJoin",
      description: "Fires when a player joins the game. Provides the player object as a parameter.",
      syntax: "@trigger onPlayerJoin(player) { ... }",
      example: `@trigger onPlayerJoin(player) {
  sendMessage(player, "Welcome!")
  giveItem(player, "starter_kit", 1)
}`
    },
    {
      title: "onPlayerDeath",
      description: "Fires when a player dies. Provides both player and killer (if applicable).",
      syntax: "@trigger onPlayerDeath(player, killer) { ... }",
      example: `@trigger onPlayerDeath(player, killer) {
  if (killer != null) {
    addScore(killer, 10)
  }
  respawn(player)
}`
    },
    {
      title: "onGameStart",
      description: "Fires when the game round begins.",
      syntax: "@trigger onGameStart() { ... }",
      example: `@trigger onGameStart() {
  setTimer(300)
  broadcastMessage("Game Started!")
}`
    }
  ],
  commands: [
    {
      title: "Custom Commands",
      description: "Create custom slash commands that players can use in chat.",
      syntax: "@command /commandName { ... }",
      example: `@command /heal {
  if (player.health < 100) {
    setHealth(player, 100)
    sendMessage(player, "Healed!")
  }
}`
    },
    {
      title: "Admin Commands",
      description: "Commands restricted to admins using permission checks.",
      syntax: "@command /admin_command { if (player.isAdmin) { ... } }",
      example: `@command /kick {
  if (player.isAdmin) {
    kickPlayer(args[0])
  }
}`
    }
  ],
  events: [
    {
      title: "onItemPickup",
      description: "Fires when a player picks up an item.",
      syntax: "@event onItemPickup(player, item) { ... }",
      example: `@event onItemPickup(player, item) {
  sendMessage(player, "Picked up: " + item.name)
}`
    },
    {
      title: "onZoneEnter",
      description: "Fires when a player enters a defined zone.",
      syntax: "@event onZoneEnter(player, zone) { ... }",
      example: `@event onZoneEnter(player, zone) {
  if (zone.name == "safe_zone") {
    setInvincible(player, true)
  }
}`
    }
  ],
  variables: [
    {
      title: "Player Variables",
      description: "Access player properties like health, score, position.",
      syntax: "player.property",
      example: `// Available properties:
player.name     // String
player.health   // Number (0-100)
player.score    // Number
player.position // {x, y, z}
player.isAdmin  // Boolean`
    },
    {
      title: "Global Variables",
      description: "Store game-wide data accessible from anywhere.",
      syntax: "global.variableName = value",
      example: `// Set global variable
global.gameMode = "deathmatch"
global.maxPlayers = 16

// Access it anywhere
if (global.gameMode == "deathmatch") {
  // ...
}`
    }
  ],
  objects: [
    {
      title: "Item Object",
      description: "Represents an in-game item with properties.",
      syntax: "item.property",
      example: `// Item properties
item.name      // String
item.type      // "weapon" | "consumable" | "tool"
item.quantity  // Number
item.rarity    // "common" | "rare" | "epic"`
    },
    {
      title: "Zone Object",
      description: "Defines a spatial area in the game world.",
      syntax: "zone.property",
      example: `// Zone properties
zone.name      // String
zone.bounds    // {x1, y1, x2, y2}
zone.type      // "safe" | "danger" | "spawn"
zone.isActive  // Boolean`
    }
  ]
};

export function Documentation() {
  const [activeCategory, setActiveCategory] = useState("triggers");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocs = docs[activeCategory]?.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-56 border-r border-border/50 glass-panel p-4 space-y-2">
        <h3 className="text-sm font-display text-primary neon-glow mb-4">CATEGORIES</h3>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
              activeCategory === cat.id
                ? "bg-primary/10 neon-border"
                : "hover:bg-muted/50"
            }`}
          >
            <cat.icon className={`w-4 h-4 ${cat.color}`} />
            <span className="font-ui text-sm">{cat.name}</span>
            {activeCategory === cat.id && (
              <ChevronRight className="w-4 h-4 ml-auto text-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documentation..."
            className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 font-ui text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
          />
        </div>

        {/* Docs List */}
        <div className="space-y-6">
          {filteredDocs.map((doc, i) => (
            <div key={i} className="glass-panel rounded-lg p-5 neon-border hover:border-primary/50 transition-all">
              <h4 className="text-lg font-display text-primary neon-glow mb-2">{doc.title}</h4>
              <p className="text-sm text-muted-foreground mb-4">{doc.description}</p>
              
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-secondary font-semibold uppercase tracking-wider">Syntax</span>
                  <pre className="mt-1 bg-muted/50 rounded p-2 text-sm font-mono text-foreground overflow-x-auto">
                    {doc.syntax}
                  </pre>
                </div>
                
                <div>
                  <span className="text-xs text-accent font-semibold uppercase tracking-wider">Example</span>
                  <pre className="mt-1 bg-muted/50 rounded p-3 text-sm font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                    {doc.example}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

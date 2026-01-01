import { useState } from "react";
import { Copy, Check, Search, Tag, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const snippets = [
  {
    id: 1,
    title: "Player Spawn System",
    description: "Complete spawn system with random locations and starter items",
    tags: ["spawn", "items", "beginner"],
    code: `@trigger onPlayerJoin(player) {
  // Random spawn selection
  var spawns = getSpawnPoints()
  var randomSpawn = spawns[random(0, spawns.length)]
  
  teleport(player, randomSpawn)
  
  // Starter kit
  giveItem(player, "pistol", 1)
  giveItem(player, "ammo", 30)
  giveItem(player, "medkit", 2)
  
  sendMessage(player, "Welcome! Good luck!")
}`,
    author: "Community"
  },
  {
    id: 2,
    title: "Kill Streak Rewards",
    description: "Award players for consecutive kills with special items",
    tags: ["combat", "rewards", "intermediate"],
    code: `@trigger onPlayerKill(killer, victim) {
  global.streaks[killer.id] = (global.streaks[killer.id] || 0) + 1
  var streak = global.streaks[killer.id]
  
  if (streak == 3) {
    giveItem(killer, "speed_boost", 1)
    broadcastMessage(killer.name + " is on fire! 3 kills!")
  } else if (streak == 5) {
    giveItem(killer, "shield", 1)
    broadcastMessage(killer.name + " DOMINATING! 5 kills!")
  } else if (streak >= 10) {
    giveItem(killer, "super_weapon", 1)
    broadcastMessage(killer.name + " UNSTOPPABLE!")
  }
}

@trigger onPlayerDeath(player) {
  global.streaks[player.id] = 0
}`,
    author: "ProCoder"
  },
  {
    id: 3,
    title: "Safe Zone Manager",
    description: "Create and manage safe zones where players can't take damage",
    tags: ["zones", "protection", "beginner"],
    code: `@event onZoneEnter(player, zone) {
  if (zone.type == "safe") {
    setInvincible(player, true)
    setEffect(player, "shield_glow", true)
    sendMessage(player, "Entered safe zone")
  }
}

@event onZoneExit(player, zone) {
  if (zone.type == "safe") {
    setInvincible(player, false)
    setEffect(player, "shield_glow", false)
    sendMessage(player, "Left safe zone - be careful!")
  }
}`,
    author: "ZoneMaster"
  },
  {
    id: 4,
    title: "Team Balancer",
    description: "Automatically balance teams when players join or leave",
    tags: ["teams", "balance", "advanced"],
    code: `@trigger onPlayerJoin(player) {
  var teamA = getTeamPlayers("red")
  var teamB = getTeamPlayers("blue")
  
  if (teamA.length <= teamB.length) {
    setTeam(player, "red")
    sendMessage(player, "You joined Red Team!")
  } else {
    setTeam(player, "blue")
    sendMessage(player, "You joined Blue Team!")
  }
}

@command /balance {
  if (player.isAdmin) {
    autoBalanceTeams()
    broadcastMessage("Teams have been balanced!")
  }
}`,
    author: "TeamLead"
  },
  {
    id: 5,
    title: "Timed Game Modes",
    description: "Switch between different game modes on a timer",
    tags: ["gamemode", "timer", "advanced"],
    code: `@trigger onGameStart() {
  global.modeIndex = 0
  global.modes = ["deathmatch", "capture", "survival"]
  
  setGameMode(global.modes[0])
  startModeTimer()
}

function startModeTimer() {
  delay(300000) {  // 5 minutes
    global.modeIndex = (global.modeIndex + 1) % global.modes.length
    var newMode = global.modes[global.modeIndex]
    
    setGameMode(newMode)
    broadcastMessage("Mode changed to: " + newMode)
    
    startModeTimer()  // Loop
  }
}`,
    author: "GameDev"
  }
];

export function SnippetsGalleryClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const allTags = [...new Set(snippets.flatMap(s => s.tags))];

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          snippet.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || snippet.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleCopy = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display text-primary neon-glow">Code Snippets</h2>
          <p className="text-sm text-muted-foreground mt-1">Ready-to-use code blocks for your Junon games</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search snippets..."
            className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2 font-ui text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedTag(null)}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-ui transition-all ${
            !selectedTag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tag className="w-3 h-3" />
          All
        </button>
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            className={`px-3 py-1 rounded-full text-sm font-ui transition-all ${
              selectedTag === tag 
                ? "bg-secondary text-secondary-foreground" 
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Snippets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSnippets.map(snippet => (
          <div
            key={snippet.id}
            className="glass-panel rounded-lg overflow-hidden neon-border hover:border-primary/50 transition-all group"
          >
            {/* Card Header */}
            <div className="p-4 border-b border-border/30">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-foreground group-hover:text-primary transition-colors">
                    {snippet.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{snippet.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(snippet.id, snippet.code)}
                  className="text-muted-foreground hover:text-primary shrink-0"
                >
                  {copiedId === snippet.id ? (
                    <Check className="w-4 h-4 text-accent" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                {snippet.tags.map(tag => (
                  <span 
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
                <span className="text-xs text-muted-foreground ml-auto">
                  by {snippet.author}
                </span>
              </div>
            </div>

            {/* Code Preview */}
            <div className="relative">
              <div className="absolute top-2 left-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Code2 className="w-3 h-3" />
                <span>Preview</span>
              </div>
              <pre className="p-4 pt-8 text-xs font-mono text-foreground/80 overflow-x-auto max-h-48 bg-muted/30">
                {snippet.code}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


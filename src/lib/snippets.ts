export interface Snippet {
  id: number;
  title: string;
  description: string;
  tags: string[];
  code: string;
  author: string;
}

// Default snippets (built-in)
export const defaultSnippets: Snippet[] = [
  {
    id: 1,
    title: "Player Welcome System",
    description: "Welcome players with message and starter items when they join",
    tags: ["player", "welcome", "beginner"],
    code: `@trigger PlayerJoined
    @commands
        /chat $player "Welcome to the game!"
        /give $player sword 1
        /chat $player "Use /help for commands"`,
    author: "Community"
  },
  {
    id: 2,
    title: "Health Check System",
    description: "Check player health when it changes and send messages or heal them",
    tags: ["health", "condition", "intermediate"],
    code: `@trigger HealthChanged
    @if $current <= 20
        then @commands
            /chat $player "Low health warning!"
            /health gain $player 30
    @if $current == 100
        then /chat $player "You are at full health!"`,
    author: "Community"
  },
  {
    id: 3,
    title: "Delayed Message System",
    description: "Send messages after a delay using timer",
    tags: ["timer", "messages", "intermediate"],
    code: `@trigger PlayerJoined
    @timer MessageTimer1 5000 1
    @timer MessageTimer2 10000 1`,
    author: "Community"
  },
  {
    id: 4,
    title: "Welcome Package System",
    description: "Give starter package to new players",
    tags: ["items", "welcome", "beginner"],
    code: `@trigger PlayerJoined
    @commands
        /give $player survival_tool 1
        /give $player medkit 3
        /give $player ammo 50
        /chat $player "Welcome package received!"`,
    author: "Community"
  },
  {
    id: 5,
    title: "Conditional Item Giving",
    description: "Give different items based on player health changes",
    tags: ["items", "condition", "intermediate"],
    code: `@trigger HealthChanged
    @if $current < 50
        then @commands
            /give $player medkit 2
            /chat $player "Here are some medkits"
    @if $current >= 100
        then @commands
            /give $player weapon 1
            /chat $player "You're healthy! Here's a weapon"`,
    author: "Community"
  },
  {
    id: 6,
    title: "Player Respawn System",
    description: "Give items and welcome message when player respawns",
    tags: ["respawn", "items", "beginner"],
    code: `@trigger PlayerRespawn
    @commands
        /give $player survival_tool 1
        /chat $player "Welcome back!"
        /chat $player "You have been respawned"`,
    author: "Community"
  },
  {
    id: 7,
    title: "Player Leave Announcement",
    description: "Announce when a player leaves the server",
    tags: ["player", "announcement", "beginner"],
    code: `@trigger PlayerLeft
    @commands
        /chat @a "$player left the server"`,
    author: "Community"
  },
  {
    id: 8,
    title: "Periodic Health Check",
    description: "Check and heal player health periodically using timer",
    tags: ["health", "timer", "intermediate"],
    code: `@trigger PlayerJoined
    @timer HealthCheck 30000 1`,
    author: "Community"
  },
  {
    id: 9,
    title: "Player Attack Handler",
    description: "Handle when a player gets attacked",
    tags: ["combat", "attack", "intermediate"],
    code: `@trigger PlayerAttacked
    @commands
        /chat $player "was attacked by $attackingPlayer!"
    @if $damage > 50
        then @commands
            /chat $player "You took heavy damage!"
            /health gain $player 30`,
    author: "Community"
  },
  {
    id: 10,
    title: "Player Death Handler",
    description: "Handle when a player dies",
    tags: ["death", "combat", "intermediate"],
    code: `@trigger PlayerDestroyed
    @commands
        /chat $player "has been destroyed!"
        /chat "Respawn in 5 seconds"
    @timer RespawnTimer 5000 1`,
    author: "Community"
  },
  {
    id: 11,
    title: "Player Movement Handler",
    description: "Handle when a player moves",
    tags: ["movement", "advanced"],
    code: `@trigger PlayerMove
    @commands
        /chat $player "is moving"`,
    author: "Community"
  },
  {
    id: 12,
    title: "Player Message Handler",
    description: "Handle when a player sends a chat message",
    tags: ["chat", "message", "intermediate"],
    code: `@trigger PlayerMessage
    @commands
        /chat @a "$player said: $message"`,
    author: "Community"
  },
  {
    id: 13,
    title: "Complete Welcome System",
    description: "Full welcome system with items, messages and health check",
    tags: ["welcome", "items", "condition", "advanced"],
    code: `@trigger PlayerJoined
    @commands
        /chat $player "Welcome to the game!"
        /give $player sword 1
        /give $player medkit 2
    @trigger HealthChanged
        @if $current < 50
            then @commands
                /health gain $player 50
                /chat $player "Health restored!"
    @timer WelcomeTimer 5000 1`,
    author: "Community"
  }
];

// Legacy export for backwards compatibility
export const snippets = defaultSnippets;

// Function to get all snippets (default + Supabase)
// This is a convenience function that re-exports from snippetService
export async function getSnippets() {
  const { getCombinedSnippets } = await import('./snippetService');
  return getCombinedSnippets();
}


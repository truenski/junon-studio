export interface Snippet {
  id: number;
  title: string;
  description: string;
  tags: string[];
  code: string;
  author: string;
}

export const snippets: Snippet[] = [
  {
    id: 1,
    title: "Player Welcome System",
    description: "Welcome players with message and starter items when they join",
    tags: ["player", "welcome", "beginner"],
    code: `@trigger PlayerJoined
    @commands
        /chat Welcome to the game!
        /give sword 1
        /chat Use /help for commands`,
    author: "Community"
  },
  {
    id: 2,
    title: "Health Check System",
    description: "Check player health and send messages or heal them",
    tags: ["health", "condition", "intermediate"],
    code: `@trigger PlayerJoined
    @if player.health == 100
        then /chat Player is at full health
        elseif player.health < 50
        then /chat Your health is low!
        then /heal player`,
    author: "Community"
  },
  {
    id: 3,
    title: "Delayed Message System",
    description: "Send messages after a delay using timer",
    tags: ["timer", "messages", "intermediate"],
    code: `@trigger PlayerJoined
    @timer 5000
        /chat 5 seconds have passed!
    @timer 10000
        /chat 10 seconds have passed!`,
    author: "Community"
  },
  {
    id: 4,
    title: "Welcome Package System",
    description: "Give starter package to new players",
    tags: ["items", "welcome", "beginner"],
    code: `@trigger PlayerJoined
    @commands
        /give survival_tool 1
        /give medkit 3
        /give ammo 50
        /chat Welcome package received!`,
    author: "Community"
  },
  {
    id: 5,
    title: "Conditional Item Giving",
    description: "Give different items based on player conditions",
    tags: ["items", "condition", "intermediate"],
    code: `@trigger PlayerJoined
    @if player.health < 100
        then /give medkit 2
        then /chat Here are some medkits
        elseif player.health == 100
        then /give weapon 1
        then /chat You're healthy! Here's a weapon`,
    author: "Community"
  },
  {
    id: 6,
    title: "Player Respawn System",
    description: "Give items and welcome message when player respawns",
    tags: ["respawn", "items", "beginner"],
    code: `@trigger PlayerRespawn
    @commands
        /give survival_tool 1
        /chat Welcome back!
        /chat You have been respawned`,
    author: "Community"
  },
  {
    id: 7,
    title: "Player Leave Announcement",
    description: "Announce when a player leaves the server",
    tags: ["player", "announcement", "beginner"],
    code: `@trigger PlayerLeft
    @commands
        /chat Player left the server`,
    author: "Community"
  },
  {
    id: 8,
    title: "Periodic Health Check",
    description: "Check and heal player health periodically",
    tags: ["health", "timer", "intermediate"],
    code: `@trigger PlayerJoined
    @timer 30000
        @if player.health < 50
            then /heal player
            then /chat Health restored!`,
    author: "Community"
  },
  {
    id: 9,
    title: "Player Attack Handler",
    description: "Handle when a player gets attacked",
    tags: ["combat", "attack", "intermediate"],
    code: `@trigger PlayerAttacked
    @commands
        /chat Player was attacked!
    @if player.health < 20
        then /chat Player health is critical!
        then /heal player`,
    author: "Community"
  },
  {
    id: 10,
    title: "Player Death Handler",
    description: "Handle when a player dies",
    tags: ["death", "combat", "intermediate"],
    code: `@trigger PlayerDestroyed
    @commands
        /chat Player has been destroyed!
        /chat Respawn in 5 seconds
    @timer 5000
        /respawn player`,
    author: "Community"
  },
  {
    id: 11,
    title: "Player Movement Handler",
    description: "Handle when a player moves",
    tags: ["movement", "advanced"],
    code: `@trigger PlayerMove
    @commands
        /chat Player is moving`,
    author: "Community"
  },
  {
    id: 12,
    title: "Player Message Handler",
    description: "Handle when a player sends a chat message",
    tags: ["chat", "message", "intermediate"],
    code: `@trigger PlayerMessage
    @commands
        /chat Message received from player`,
    author: "Community"
  },
  {
    id: 13,
    title: "Complete Welcome System",
    description: "Full welcome system with items, messages and conditions",
    tags: ["welcome", "items", "condition", "advanced"],
    code: `@trigger PlayerJoined
    @commands
        /chat Welcome to the game!
        /give sword 1
        /give medkit 2
    @if player.health == 100
        then /chat Player is at full health
        elseif player.health != 100
        then /heal player
    @timer 5000
        /chat 5 seconds passed`,
    author: "Community"
  }
];


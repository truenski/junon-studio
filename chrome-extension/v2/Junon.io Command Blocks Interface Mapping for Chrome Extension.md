# Junon.io Command Blocks Interface Mapping for Chrome Extension

This document provides a detailed mapping of the **Junon.io Command Blocks** interface, specifically focusing on the elements required to create new triggers, commands, timers, and if-then-else logic. This information is intended to guide the development of a Chrome extension for automated interaction with this interface.

## 1. Accessing the Command Blocks Interface

The Command Blocks interface is a modal window accessible within the game world.

| Action | Element | Selector/Method | Notes |
| :--- | :--- | :--- | :--- |
| **Open Menu** | Command Blocks Icon | Click the terminal-like icon in the top-left menu bar (typically the 3rd icon). | The modal container ID is `#command_block_menu`. |
| **Close Menu** | X Button | `.cancel_btn` | Located in the top-right corner of the modal. |
| **Menu Tabs** | Triggers, Logs, Functions | `.command_block_tab` | Tabs are selected via `data-view` attribute (e.g., `[data-view='triggers']`). |

## 2. Trigger Creation Mapping

The "Triggers" tab is the primary interface for defining new automation rules.

### 2.1. Creating a New Trigger

| Action | Element | Selector | Notes |
| :--- | :--- | :--- | :--- |
| **New Trigger Button** | `+ New Trigger` | `.add_trigger_btn` | Clicking this opens the list of available trigger types. |
| **Trigger List** | List of events (e.g., `PlayerMessage`) | `.trigger_name` (within the modal) | The list of all available triggers is extensive (see Section 4). |
| **Confirm Creation** | `CREATE` Button | `.menu_main_footer .btn_primary` | Finalizes the selection of the trigger type. |

### 2.2. Available Trigger Types

The following is a comprehensive list of all detectable trigger events, which can be used to initiate an action sequence:

| Category | Trigger Events |
| :--- | :--- |
| **Player Actions** | PlayerJoined, PlayerLeft, PlayerMessage, PlayerAttacked, PlayerDestroyed, PlayerMove, PlayerRespawn, PlayerKeyboard |
| **Mob Actions** | MobAttacked, MobDestroyed, MobFeed, MobTamed, MobFollow, MobRelease, MobMount, MobUnmount |
| **Building/Item** | BuildingAttacked, BuildingPlaced, BuildingDeconstructed, AsteroidMined, ItemCrafted, InteractBuilding, ItemBuy, ItemSell, ItemUsed, ItemConsumed, ItemDropped, ItemPickup, CropHarvested, CropPlanted, CorpseButchered, CorpseDragged, CorpseReleased, FoodCooked, StoragePut, StorageGet, ButtonClicked |
| **Colony/World** | TeamMemberAdded, TeamMemberRemoved, RegionEnter, RegionLeave, ColonyLike, ColonyUnlike, WorldLoaded, RoleChanged |
| **Stats/Status** | HealthChanged, OxygenChanged, HungerChanged, StaminaChanged, ScoreChanged, GoldChanged, ArmorEquipChanged, PlatformCleaned |
| **Timer Events** | Timer:start, Timer:tick, Timer:end |

## 3. Action Creation Mapping

Once a trigger is created, actions are added to its sequence. The actions are added by clicking the **plus icon** (`.trigger_actions img`) next to the `Actions:` label.

### 3.1. Core Action Types

The extension should focus on the following three core action types, which are presented in a modal after clicking the plus icon:

| Action Type | Selector for Selection | Purpose |
| :--- | :--- | :--- |
| **commands** | `.left_content_entry` with text `commands` | Executes a single or multi-line console command. |
| **ifthenelse** | `.left_content_entry` with text `ifthenelse` | Implements conditional logic (if/then/else). |
| **timer** | `.left_content_entry` with text `timer` | Starts a named timer that can trigger other events. |

### 3.2. Detailed Action Structure

#### A. Commands Action

This action is a simple text input field for the command string.

| Element | Selector | Notes |
| :--- | :--- | :--- |
| **Input Field** | `input[type='text']` (within the modal) | Accepts standard Junon console commands, including variable names (starting with `$`) and target selectors (starting with `@`). |
| **Example** | `/give $player potato 5` | Shows how to use event variables. |

#### B. IfThenElse Action

This action is a container for nested actions, allowing for complex logic.

| Element | Selector | Purpose |
| :--- | :--- | :--- |
| **Condition Input** | `input[type='text']` (within the modal) | The conditional expression (e.g., `$player != insert_owner_name`). |
| **Then Actions** | Plus icon next to `Then:` | `.ifthenelse_then .add_action_btn` | Clicking this opens the action selection modal for the "Then" block. |
| **Else Actions** | Plus icon next to `Else:` | `.ifthenelse_else .add_action_btn` | Clicking this opens the action selection modal for the "Else" block. |

#### C. Timer Action

This action is used to start a named timer, which can be used as a trigger event (`Timer:start`, `Timer:tick`, `Timer:end`).

| Element | Selector | Purpose |
| :--- | :--- | :--- |
| **Name Input** | `input[placeholder='name']` | The unique name of the timer. |
| **Duration Input** | `input[type='number']:nth-of-type(1)` | The total duration of the timer in seconds. |
| **Tick Input** | `input[type='number']:nth-of-type(2)` | The interval (in seconds) at which the `Timer:tick` event is emitted. |

## 4. Conclusion

The interface is highly structured, relying heavily on `div` elements with specific class names (`.trigger_name`, `.action_entry`, `.left_content_entry`) and a consistent modal pattern. The provided selectors and lists of available triggers and actions should be sufficient for the Chrome extension to programmatically interact with and automate the creation of command blocks.

***

**References**

[1] Junon.io Command Blocks Interface. (2026). *In-game interface inspection*. [Accessed 1 Jan 2026].

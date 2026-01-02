declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
			components: import('astro').MDXInstance<{}>['components'];
		}>;
	}
}

declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"blog": {
"first-post.md": {
	id: "first-post.md";
  slug: "first-post";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"markdown-style-guide.md": {
	id: "markdown-style-guide.md";
  slug: "markdown-style-guide";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"second-post.md": {
	id: "second-post.md";
  slug: "second-post";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".md"] };
"using-mdx.mdx": {
	id: "using-mdx.mdx";
  slug: "using-mdx";
  body: string;
  collection: "blog";
  data: any
} & { render(): Render[".mdx"] };
};
"commands": {
"ban.mdx": {
	id: "ban.mdx";
  slug: "ban";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"blood.mdx": {
	id: "blood.mdx";
  slug: "blood";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"caption.mdx": {
	id: "caption.mdx";
  slug: "caption";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"chat.mdx": {
	id: "chat.mdx";
  slug: "chat";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"clear.mdx": {
	id: "clear.mdx";
  slug: "clear";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"day.mdx": {
	id: "day.mdx";
  slug: "day";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"dialogue.mdx": {
	id: "dialogue.mdx";
  slug: "dialogue";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"dirt.mdx": {
	id: "dirt.mdx";
  slug: "dirt";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"effect.mdx": {
	id: "effect.mdx";
  slug: "effect";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"event.mdx": {
	id: "event.mdx";
  slug: "event";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"fill.mdx": {
	id: "fill.mdx";
  slug: "fill";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"fly.mdx": {
	id: "fly.mdx";
  slug: "fly";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"force.mdx": {
	id: "force.mdx";
  slug: "force";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"getnthletter.mdx": {
	id: "getnthletter.mdx";
  slug: "getnthletter";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"getnthword.mdx": {
	id: "getnthword.mdx";
  slug: "getnthword";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"give.mdx": {
	id: "give.mdx";
  slug: "give";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"god.mdx": {
	id: "god.mdx";
  slug: "god";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"gold.mdx": {
	id: "gold.mdx";
  slug: "gold";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"health.mdx": {
	id: "health.mdx";
  slug: "health";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"hour.mdx": {
	id: "hour.mdx";
  slug: "hour";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"hunger.mdx": {
	id: "hunger.mdx";
  slug: "hunger";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"interact.mdx": {
	id: "interact.mdx";
  slug: "interact";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"kick.mdx": {
	id: "kick.mdx";
  slug: "kick";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"kill.mdx": {
	id: "kill.mdx";
  slug: "kill";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"kit.mdx": {
	id: "kit.mdx";
  slug: "kit";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"limit.mdx": {
	id: "limit.mdx";
  slug: "limit";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"mute.mdx": {
	id: "mute.mdx";
  slug: "mute";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"name.mdx": {
	id: "name.mdx";
  slug: "name";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"needs.mdx": {
	id: "needs.mdx";
  slug: "needs";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"oxygen.mdx": {
	id: "oxygen.mdx";
  slug: "oxygen";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"path.mdx": {
	id: "path.mdx";
  slug: "path";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"playsound.mdx": {
	id: "playsound.mdx";
  slug: "playsound";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"region.mdx": {
	id: "region.mdx";
  slug: "region";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"respawn.mdx": {
	id: "respawn.mdx";
  slug: "respawn";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"role.mdx": {
	id: "role.mdx";
  slug: "role";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"scene.mdx": {
	id: "scene.mdx";
  slug: "scene";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"score.mdx": {
	id: "score.mdx";
  slug: "score";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"setequipment.mdx": {
	id: "setequipment.mdx";
  slug: "setequipment";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"sethealth.mdx": {
	id: "sethealth.mdx";
  slug: "sethealth";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"setowner.mdx": {
	id: "setowner.mdx";
  slug: "setowner";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"setting.mdx": {
	id: "setting.mdx";
  slug: "setting";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"sidebar.mdx": {
	id: "sidebar.mdx";
  slug: "sidebar";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"spawncorpse.mdx": {
	id: "spawncorpse.mdx";
  slug: "spawncorpse";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"spawnitem.mdx": {
	id: "spawnitem.mdx";
  slug: "spawnitem";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"spawnmob.mdx": {
	id: "spawnmob.mdx";
  slug: "spawnmob";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"spectate.mdx": {
	id: "spectate.mdx";
  slug: "spectate";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"speed.mdx": {
	id: "speed.mdx";
  slug: "speed";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"stamina.mdx": {
	id: "stamina.mdx";
  slug: "stamina";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"stat.mdx": {
	id: "stat.mdx";
  slug: "stat";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"suitcolor.mdx": {
	id: "suitcolor.mdx";
  slug: "suitcolor";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"team.mdx": {
	id: "team.mdx";
  slug: "team";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"timer.mdx": {
	id: "timer.mdx";
  slug: "timer";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"tp.mdx": {
	id: "tp.mdx";
  slug: "tp";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"trader.mdx": {
	id: "trader.mdx";
  slug: "trader";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"unmute.mdx": {
	id: "unmute.mdx";
  slug: "unmute";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"variable.mdx": {
	id: "variable.mdx";
  slug: "variable";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
"wait.mdx": {
	id: "wait.mdx";
  slug: "wait";
  body: string;
  collection: "commands";
  data: any
} & { render(): Render[".mdx"] };
};
"functions": {
"abs.mdx": {
	id: "abs.mdx";
  slug: "abs";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"add.mdx": {
	id: "add.mdx";
  slug: "add";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"ceil.mdx": {
	id: "ceil.mdx";
  slug: "ceil";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"divide.mdx": {
	id: "divide.mdx";
  slug: "divide";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"floor.mdx": {
	id: "floor.mdx";
  slug: "floor";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"formatTime.mdx": {
	id: "formatTime.mdx";
  slug: "formattime";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getAngle.mdx": {
	id: "getAngle.mdx";
  slug: "getangle";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getArmorEquip.mdx": {
	id: "getArmorEquip.mdx";
  slug: "getarmorequip";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getBuildingType.mdx": {
	id: "getBuildingType.mdx";
  slug: "getbuildingtype";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getCapacity.mdx": {
	id: "getCapacity.mdx";
  slug: "getcapacity";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getCol.mdx": {
	id: "getCol.mdx";
  slug: "getcol";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getContent.mdx": {
	id: "getContent.mdx";
  slug: "getcontent";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getDay.mdx": {
	id: "getDay.mdx";
  slug: "getday";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getEquip.mdx": {
	id: "getEquip.mdx";
  slug: "getequip";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getEquipCount.mdx": {
	id: "getEquipCount.mdx";
  slug: "getequipcount";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getEquipId.mdx": {
	id: "getEquipId.mdx";
  slug: "getequipid";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getGold.mdx": {
	id: "getGold.mdx";
  slug: "getgold";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getHealth.mdx": {
	id: "getHealth.mdx";
  slug: "gethealth";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getHour.mdx": {
	id: "getHour.mdx";
  slug: "gethour";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getHunger.mdx": {
	id: "getHunger.mdx";
  slug: "gethunger";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getInventoryItemCount.mdx": {
	id: "getInventoryItemCount.mdx";
  slug: "getinventoryitemcount";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getMaxHealth.mdx": {
	id: "getMaxHealth.mdx";
  slug: "getmaxhealth";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getMaxHunger.mdx": {
	id: "getMaxHunger.mdx";
  slug: "getmaxhunger";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getMaxOxygen.mdx": {
	id: "getMaxOxygen.mdx";
  slug: "getmaxoxygen";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getMaxStamina.mdx": {
	id: "getMaxStamina.mdx";
  slug: "getmaxstamina";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getOwner.mdx": {
	id: "getOwner.mdx";
  slug: "getowner";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getOxygen.mdx": {
	id: "getOxygen.mdx";
  slug: "getoxygen";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getPlatformByCoords.mdx": {
	id: "getPlatformByCoords.mdx";
  slug: "getplatformbycoords";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getPlayerCount.mdx": {
	id: "getPlayerCount.mdx";
  slug: "getplayercount";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getRegion.mdx": {
	id: "getRegion.mdx";
  slug: "getregion";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getRegionPlayerCount.mdx": {
	id: "getRegionPlayerCount.mdx";
  slug: "getregionplayercount";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getRole.mdx": {
	id: "getRole.mdx";
  slug: "getrole";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getRoleMemberCount.mdx": {
	id: "getRoleMemberCount.mdx";
  slug: "getrolemembercount";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getRow.mdx": {
	id: "getRow.mdx";
  slug: "getrow";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getScore.mdx": {
	id: "getScore.mdx";
  slug: "getscore";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getSpeed.mdx": {
	id: "getSpeed.mdx";
  slug: "getspeed";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getStamina.mdx": {
	id: "getStamina.mdx";
  slug: "getstamina";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getStructureByCoords.mdx": {
	id: "getStructureByCoords.mdx";
  slug: "getstructurebycoords";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getTeam.mdx": {
	id: "getTeam.mdx";
  slug: "getteam";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getTeamMemberCount.mdx": {
	id: "getTeamMemberCount.mdx";
  slug: "getteammembercount";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getTotalMobCount.mdx": {
	id: "getTotalMobCount.mdx";
  slug: "gettotalmobcount";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"getUsage.mdx": {
	id: "getUsage.mdx";
  slug: "getusage";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"hasEffect.mdx": {
	id: "hasEffect.mdx";
  slug: "haseffect";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"isLoggedIn.mdx": {
	id: "isLoggedIn.mdx";
  slug: "isloggedin";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"log.mdx": {
	id: "log.mdx";
  slug: "log";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"max.mdx": {
	id: "max.mdx";
  slug: "max";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"min.mdx": {
	id: "min.mdx";
  slug: "min";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"modulo.mdx": {
	id: "modulo.mdx";
  slug: "modulo";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"multiply.mdx": {
	id: "multiply.mdx";
  slug: "multiply";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"pow.mdx": {
	id: "pow.mdx";
  slug: "pow";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"random.mdx": {
	id: "random.mdx";
  slug: "random";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"root.mdx": {
	id: "root.mdx";
  slug: "root";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"round.mdx": {
	id: "round.mdx";
  slug: "round";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
"subtract.mdx": {
	id: "subtract.mdx";
  slug: "subtract";
  body: string;
  collection: "functions";
  data: any
} & { render(): Render[".mdx"] };
};
"triggers": {
"ArmorEquipChanged.mdx": {
	id: "ArmorEquipChanged.mdx";
  slug: "armorequipchanged";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"AsteroidMined.mdx": {
	id: "AsteroidMined.mdx";
  slug: "asteroidmined";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"BuildingAttacked.mdx": {
	id: "BuildingAttacked.mdx";
  slug: "buildingattacked";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"BuildingDeconstructed.mdx": {
	id: "BuildingDeconstructed.mdx";
  slug: "buildingdeconstructed";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"BuildingPlaced.mdx": {
	id: "BuildingPlaced.mdx";
  slug: "buildingplaced";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"ButtonClicked.mdx": {
	id: "ButtonClicked.mdx";
  slug: "buttonclicked";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"ColonyLike.mdx": {
	id: "ColonyLike.mdx";
  slug: "colonylike";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"ColonyUnlike.mdx": {
	id: "ColonyUnlike.mdx";
  slug: "colonyunlike";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"CorpseButchered.mdx": {
	id: "CorpseButchered.mdx";
  slug: "corpsebutchered";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"CorpseDragged.mdx": {
	id: "CorpseDragged.mdx";
  slug: "corpsedragged";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"CorpseReleased.mdx": {
	id: "CorpseReleased.mdx";
  slug: "corpsereleased";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"CropHarvested.mdx": {
	id: "CropHarvested.mdx";
  slug: "cropharvested";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"CropPlanted.mdx": {
	id: "CropPlanted.mdx";
  slug: "cropplanted";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"FoodCooked.mdx": {
	id: "FoodCooked.mdx";
  slug: "foodcooked";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"GoldChanged.mdx": {
	id: "GoldChanged.mdx";
  slug: "goldchanged";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"HealthChanged.mdx": {
	id: "HealthChanged.mdx";
  slug: "healthchanged";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"HungerChanged.mdx": {
	id: "HungerChanged.mdx";
  slug: "hungerchanged";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"InteractBuilding.mdx": {
	id: "InteractBuilding.mdx";
  slug: "interactbuilding";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"ItemBuy.mdx": {
	id: "ItemBuy.mdx";
  slug: "itembuy";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"ItemConsumed.mdx": {
	id: "ItemConsumed.mdx";
  slug: "itemconsumed";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"ItemCrafted.mdx": {
	id: "ItemCrafted.mdx";
  slug: "itemcrafted";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"ItemDropped.mdx": {
	id: "ItemDropped.mdx";
  slug: "itemdropped";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"ItemPickup.mdx": {
	id: "ItemPickup.mdx";
  slug: "itempickup";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"ItemSell.mdx": {
	id: "ItemSell.mdx";
  slug: "itemsell";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"ItemUsed.mdx": {
	id: "ItemUsed.mdx";
  slug: "itemused";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"MobAttacked.mdx": {
	id: "MobAttacked.mdx";
  slug: "mobattacked";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"MobDestroyed.mdx": {
	id: "MobDestroyed.mdx";
  slug: "mobdestroyed";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"MobFeed.mdx": {
	id: "MobFeed.mdx";
  slug: "mobfeed";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"MobFollow.mdx": {
	id: "MobFollow.mdx";
  slug: "mobfollow";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"MobMount.mdx": {
	id: "MobMount.mdx";
  slug: "mobmount";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"MobRelease.mdx": {
	id: "MobRelease.mdx";
  slug: "mobrelease";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"MobTamed.mdx": {
	id: "MobTamed.mdx";
  slug: "mobtamed";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"MobUnmount.mdx": {
	id: "MobUnmount.mdx";
  slug: "mobunmount";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"OxygenChanged.mdx": {
	id: "OxygenChanged.mdx";
  slug: "oxygenchanged";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"PlatformCleaned.mdx": {
	id: "PlatformCleaned.mdx";
  slug: "platformcleaned";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"PlayerAttacked.mdx": {
	id: "PlayerAttacked.mdx";
  slug: "playerattacked";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"PlayerDestroyed.mdx": {
	id: "PlayerDestroyed.mdx";
  slug: "playerdestroyed";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"PlayerJoined.mdx": {
	id: "PlayerJoined.mdx";
  slug: "playerjoined";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"PlayerKeyboard.mdx": {
	id: "PlayerKeyboard.mdx";
  slug: "playerkeyboard";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"PlayerLeft.mdx": {
	id: "PlayerLeft.mdx";
  slug: "playerleft";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"PlayerMessage.mdx": {
	id: "PlayerMessage.mdx";
  slug: "playermessage";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"PlayerMove.mdx": {
	id: "PlayerMove.mdx";
  slug: "playermove";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"PlayerRespawn.mdx": {
	id: "PlayerRespawn.mdx";
  slug: "playerrespawn";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"RegionEnter.mdx": {
	id: "RegionEnter.mdx";
  slug: "regionenter";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"RegionLeave.mdx": {
	id: "RegionLeave.mdx";
  slug: "regionleave";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"RoleChanged.mdx": {
	id: "RoleChanged.mdx";
  slug: "rolechanged";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"ScoreChanged.mdx": {
	id: "ScoreChanged.mdx";
  slug: "scorechanged";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"StaminaChanged.mdx": {
	id: "StaminaChanged.mdx";
  slug: "staminachanged";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"StorageGet.mdx": {
	id: "StorageGet.mdx";
  slug: "storageget";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"StoragePut.mdx": {
	id: "StoragePut.mdx";
  slug: "storageput";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"TeamMemberAdded.mdx": {
	id: "TeamMemberAdded.mdx";
  slug: "teammemberadded";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"TeamMemberRemoved.mdx": {
	id: "TeamMemberRemoved.mdx";
  slug: "teammemberremoved";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"Timer-1-end.mdx": {
	id: "Timer-1-end.mdx";
  slug: "timer-1-end";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"Timer-1-start.mdx": {
	id: "Timer-1-start.mdx";
  slug: "timer-1-start";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"Timer-1-tick.mdx": {
	id: "Timer-1-tick.mdx";
  slug: "timer-1-tick";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"Timer-RoundTimer-end.mdx": {
	id: "Timer-RoundTimer-end.mdx";
  slug: "timer-roundtimer-end";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"Timer-RoundTimer-start.mdx": {
	id: "Timer-RoundTimer-start.mdx";
  slug: "timer-roundtimer-start";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"Timer-RoundTimer-tick.mdx": {
	id: "Timer-RoundTimer-tick.mdx";
  slug: "timer-roundtimer-tick";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"Timer-end.mdx": {
	id: "Timer-end.mdx";
  slug: "timer-end";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"Timer-start.mdx": {
	id: "Timer-start.mdx";
  slug: "timer-start";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"Timer-tick.mdx": {
	id: "Timer-tick.mdx";
  slug: "timer-tick";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"WorldLoaded.mdx": {
	id: "WorldLoaded.mdx";
  slug: "worldloaded";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"end.mdx": {
	id: "end.mdx";
  slug: "end";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"start.mdx": {
	id: "start.mdx";
  slug: "start";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
"tick.mdx": {
	id: "tick.mdx";
  slug: "tick";
  body: string;
  collection: "triggers";
  data: any
} & { render(): Render[".mdx"] };
};

	};

	type DataEntryMap = {
		"actions": Record<string, {
  id: string;
  collection: "actions";
  data: any;
}>;
"entities": Record<string, {
  id: string;
  collection: "entities";
  data: any;
}>;
"mobs": Record<string, {
  id: string;
  collection: "mobs";
  data: any;
}>;
"suggestions": Record<string, {
  id: string;
  collection: "suggestions";
  data: any;
}>;
"variables": Record<string, {
  id: string;
  collection: "variables";
  data: any;
}>;

	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = never;
}

/**
 * Room Helper Functions
 * Utility functions for room navigation and description
 */

export const directionVectors = {
	N: { dx: 0, dy: -1 },
	NORTH: { dx: 0, dy: -1 },
	S: { dx: 0, dy: 1 },
	SOUTH: { dx: 0, dy: 1 },
	E: { dx: 1, dy: 0 },
	EAST: { dx: 1, dy: 0 },
	W: { dx: -1, dy: 0 },
	WEST: { dx: -1, dy: 0 },
};

/**
 * Find a room by its ID
 */
export function findRoomById(rooms, id) {
	return rooms?.find((r) => r.id === id) ?? null;
}

/**
 * Find a room by its grid coordinates
 */
export function findRoomByCoords(rooms, gx, gy) {
	return rooms?.find((r) => r.gx === gx && r.gy === gy) ?? null;
}

/**
 * Helper: Get entity names from IDs
 */
function getEntityNames(entityIds, globalMeta) {
	return entityIds.map(id => {
		const entity = globalMeta.entities?.find(e => e.id === id);
		return entity?.name || id;
	});
}

/**
 * Helper: Get item names from IDs
 */
function getItemNames(itemIds, globalMeta) {
	return itemIds.map(id => {
		const item = globalMeta.items?.find(i => i.id === id);
		return item?.name || id;
	});
}

/**
 * Generate a full description of a room including entities, items, and chests
 */
export function describeRoom(room, roomState = {}, globalMeta = {}) {
	if (!room) return 'You are nowhere. This is probably a bug.';

	const desc = room.meta?.description || "There is nothing remarkable about this place. The level designer hasn't done their job yet.";
	const parts = [desc];

	// List alive entities
	const entities = room.meta?.entities || [];
	const defeatedEntities = roomState.defeatedEntities || [];
	const aliveEntities = entities.filter(e => !defeatedEntities.includes(e));

	if (aliveEntities.length > 0) {
		parts.push(`\n\nYou see: ${getEntityNames(aliveEntities, globalMeta).join(', ')}`);
	}

	// Show defeated entities
	const defeatedHere = entities.filter(e => defeatedEntities.includes(e));
	if (defeatedHere.length > 0) {
		parts.push(`\n\nDefeated: ${getEntityNames(defeatedHere, globalMeta).join(', ')}`);
	}

	// List items
	const roomItems = roomState.items || [];
	if (roomItems.length > 0) {
		parts.push(`\n\nItems here: ${getItemNames(roomItems, globalMeta).join(', ')}`);
	}

	// Note chest
	if (room.meta?.hasChest && !roomState.chestOpened) {
		parts.push('\n\nYou notice a chest here.');

		const guardian = room.meta?.chestGuardian;
		if (guardian && !roomState.guardiansDefeated?.includes(guardian)) {
			const guardianEntity = globalMeta.entities?.find(e => e.id === guardian);
			parts.push(` It appears to be guarded by ${guardianEntity?.name || 'something'}.`);
		}
	}

	return parts.join('');
}

/**
 * Initialize room states with items from room metadata
 */
export function initializeRoomStates(rooms) {
	const initialRoomStates = {};
	rooms.forEach(room => {
		// Start with items defined directly in room meta
		const roomItems = [...(room.meta?.items || [])];

		initialRoomStates[room.id] = {
			items: roomItems,
			chestOpened: false,
			visitedConversations: {},
			defeatedEntities: [],
			guardiansDefeated: []
		};
	});
	return initialRoomStates;
}

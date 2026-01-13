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
 * Generate a full description of a room including entities, items, and chests
 */
export function describeRoom(room, roomState = {}, globalMeta = {}) {
	if (!room) return 'You are nowhere. This is probably a bug.';

	const desc = room.meta?.description ||
		"There is nothing remarkable about this place. The level designer hasn't done their job yet.";

	let fullDesc = `${desc}`;

	// List alive entities (NPCs) in the room
	const entities = room.meta?.entities || [];
	const defeatedEntities = roomState.defeatedEntities || [];
	const aliveEntities = entities.filter(e => !defeatedEntities.includes(e));

	if (aliveEntities.length > 0) {
		const entityDescs = aliveEntities.map(entityId => {
			const entityData = globalMeta.entities?.find(e => e.id === entityId);
			return entityData ? entityData.name : entityId;
		});
		fullDesc += `\n\nYou see: ${entityDescs.join(', ')}`;
	}

	// Show defeated entities
	const defeatedHere = entities.filter(e => defeatedEntities.includes(e));
	if (defeatedHere.length > 0) {
		const defeatedDescs = defeatedHere.map(entityId => {
			const entityData = globalMeta.entities?.find(e => e.id === entityId);
			return entityData ? entityData.name : entityId;
		});
		fullDesc += `\n\nDefeated: ${defeatedDescs.join(', ')}`;
	}

	// List items in the room
	const roomItems = roomState.items || [];
	if (roomItems.length > 0) {
		const itemDescs = roomItems.map(itemId => {
			const itemData = globalMeta.items?.find(i => i.id === itemId);
			return itemData ? itemData.name : itemId;
		});
		fullDesc += `\n\nItems here: ${itemDescs.join(', ')}`;
	}

	// Note if there's a chest
	if (room.meta?.hasChest && !roomState.chestOpened) {
		fullDesc += '\n\nYou notice a chest here.';
		// Mention if it's guarded
		if (room.meta?.chestGuardian && !roomState.guardiansDefeated?.includes(room.meta.chestGuardian)) {
			const guardianData = globalMeta.entities?.find(e => e.id === room.meta.chestGuardian);
			fullDesc += ` It appears to be guarded by ${guardianData?.name || 'something'}.`;
		}
	}

	return fullDesc;
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

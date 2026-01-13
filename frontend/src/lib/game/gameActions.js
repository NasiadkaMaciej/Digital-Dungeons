/**
 * Game Action Handlers
 * Pure functions for handling game actions (inventory, items, combat, etc.)
 */

/**
 * Helper: Find entity by name or ID
 */
function findEntityByName(name, globalMeta, entityIds = null) {
	const entities = globalMeta.entities || [];
	const matchingEntity = entities.find(e => {
		const matches = e.name.toUpperCase().includes(name) || e.id.toUpperCase() === name;
		return matches && (entityIds ? entityIds.includes(e.id) : true);
	});
	return matchingEntity || null;
}

/**
 * Helper: Find item by name or ID
 */
function findItemByName(name, globalMeta, itemIds = null) {
	const items = globalMeta.items || [];
	const matchingItem = items.find(i => {
		const matches = i.name.toUpperCase().includes(name) || i.id.toUpperCase() === name;
		return matches && (itemIds ? itemIds.includes(i.id) : true);
	});
	return matchingItem || null;
}

/**
 * Helper: Get item name by ID
 */
function getItemName(itemId, globalMeta) {
	const item = globalMeta.items?.find(i => i.id === itemId);
	return item?.name || itemId;
}

/**
 * Helper: Get entity name by ID
 */
function getEntityName(entityId, globalMeta) {
	const entity = globalMeta.entities?.find(e => e.id === entityId);
	return entity?.name || entityId;
}

/**
 * Handle taking an item from the room
 */
export function handleTakeItem(itemName, currentRoomId, roomStates, inventory, globalMeta) {
	const roomState = roomStates[currentRoomId] || {};
	const roomItems = roomState.items || [];

	const item = findItemByName(itemName, globalMeta, roomItems);
	if (!item) {
		return {
			success: false,
			message: `There is no "${itemName}" here to take.`
		};
	}

	return {
		success: true,
		message: `You take the ${item.name}.`,
		newRoomItems: roomItems.filter(id => id !== item.id),
		newInventory: [...inventory, item.id],
		itemId: item.id
	};
}

/**
 * Handle dropping an item in the current room
 */
export function handleDropItem(itemName, currentRoomId, roomStates, inventory, globalMeta) {
	const item = findItemByName(itemName, globalMeta, inventory);
	if (!item) {
		return {
			success: false,
			message: `You don't have "${itemName}" in your inventory.`
		};
	}

	const roomState = roomStates[currentRoomId] || {};
	return {
		success: true,
		message: `You drop the ${item.name}.`,
		newRoomItems: [...(roomState.items || []), item.id],
		newInventory: inventory.filter(id => id !== item.id),
		itemId: item.id
	};
}

/**
 * Handle using an item
 */
export function handleUseItem(itemName, inventory, globalMeta) {
	const item = findItemByName(itemName, globalMeta, inventory);
	if (!item) {
		return {
			success: false,
			message: `You don't have "${itemName}".`
		};
	}

	const upperName = itemName.toUpperCase();
	let message, consumed = false;

	if (upperName.includes('POTION') || upperName.includes('HEALTH')) {
		message = `You drink the ${item.name}. You feel restored!`;
		consumed = true;
	} else if (upperName.includes('KEY')) {
		message = `You hold the ${item.name} ready.`;
	} else if (upperName.includes('TORCH')) {
		message = `You light the ${item.name}. The area brightens.`;
	} else {
		message = `You examine the ${item.name}. ${item.description || 'Nothing special happens.'}`;
	}

	return {
		success: true,
		message,
		consumed,
		newInventory: consumed ? inventory.filter(id => id !== item.id) : inventory,
		itemId: item.id
	};
}

/**
 * Handle opening a chest
 */
export function handleOpenChestAction(room, roomState, inventory, globalMeta) {
	if (!room.meta?.hasChest) {
		return { success: false, message: 'There is no chest here.' };
	}

	if (roomState.chestOpened) {
		return { success: false, message: 'This chest has already been opened.' };
	}

	// Check for required key
	const requiredKey = room.meta?.chestRequiresKey;
	if (requiredKey && !inventory.includes(requiredKey)) {
		return {
			success: false,
			message: `The chest is locked. You need a ${getItemName(requiredKey, globalMeta)} to open it.`
		};
	}

	// Check for guardian
	const guardian = room.meta?.chestGuardian;
	if (guardian && !(roomState.guardiansDefeated || []).includes(guardian)) {
		return {
			success: false,
			message: `The chest is guarded by ${getEntityName(guardian, globalMeta)}! You must defeat it first.`
		};
	}

	// Open chest
	const contents = room.meta?.chestContents || [];
	const messages = [
		'You open the chest and find:',
		...contents.map(id => `  - ${getItemName(id, globalMeta)}`)
	];

	return { success: true, messages, contents };
}

/**
 * Helper: Check if player has a weapon
 */
function hasWeapon(inventory, globalMeta) {
	const weaponKeywords = ['SWORD', 'WEAPON', 'AXE', 'DAGGER'];
	return inventory.some(itemId => {
		const item = globalMeta.items?.find(i => i.id === itemId);
		const itemName = item?.name.toUpperCase() || '';
		return weaponKeywords.some(keyword => itemName.includes(keyword));
	});
}

/**
 * Handle attacking an entity
 */
export function handleAttackEntity(targetName, room, roomState, inventory, globalMeta) {
	const entities = room.meta?.entities || [];
	const target = findEntityByName(targetName, globalMeta, entities);

	if (!target) {
		return { success: false, message: `There is no "${targetName}" here to attack.` };
	}

	const defeatedEntities = roomState.defeatedEntities || [];
	if (defeatedEntities.includes(target.id)) {
		return { success: false, message: `${target.name} has already been defeated.` };
	}

	if (!target.hostile) {
		return { success: false, message: `${target.name} is not hostile. You cannot attack them!` };
	}

	if (!hasWeapon(inventory, globalMeta)) {
		return { success: false, message: `You need a weapon to attack ${target.name}!` };
	}

	// Defeat the entity
	const drops = target.drops || [];
	const messages = [
		`You attack ${target.name} with your weapon!`,
		`After a brief fight, ${target.name} is defeated!`
	];

	if (drops.length > 0) {
		const dropNames = drops.map(id => getItemName(id, globalMeta));
		messages.push(`${target.name} drops: ${dropNames.join(', ')}`);
	}

	return {
		success: true,
		messages,
		targetId: target.id,
		drops,
		newRoomItems: [...(roomState.items || []), ...drops]
	};
}

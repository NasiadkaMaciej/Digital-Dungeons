/**
 * Game Action Handlers
 * Pure functions for handling game actions (inventory, items, combat, etc.)
 */

/**
 * Handle taking an item from the room
 */
export function handleTakeItem(itemName, currentRoomId, roomStates, inventory, globalMeta) {
	const roomState = roomStates[currentRoomId] || {};
	const roomItems = roomState.items || [];

	// Find item by name or id
	const itemId = globalMeta.items?.find(
		i => i.name.toUpperCase().includes(itemName) || i.id.toUpperCase() === itemName
	)?.id;

	if (!itemId || !roomItems.includes(itemId)) {
		return {
			success: false,
			message: `There is no "${itemName}" here to take.`
		};
	}

	const itemData = globalMeta.items?.find(i => i.id === itemId);

	// Remove from room, add to inventory
	const newRoomItems = roomItems.filter(id => id !== itemId);
	const newInventory = [...inventory, itemId];

	return {
		success: true,
		message: `You take the ${itemData?.name || itemName}.`,
		newRoomItems,
		newInventory,
		itemId
	};
}

/**
 * Handle dropping an item in the current room
 */
export function handleDropItem(itemName, currentRoomId, roomStates, inventory, globalMeta) {
	// Find item by name or id in inventory
	const itemId = globalMeta.items?.find(
		i => (i.name.toUpperCase().includes(itemName) || i.id.toUpperCase() === itemName) &&
			inventory.includes(i.id)
	)?.id;

	if (!itemId) {
		return {
			success: false,
			message: `You don't have "${itemName}" in your inventory.`
		};
	}

	const itemData = globalMeta.items?.find(i => i.id === itemId);

	// Remove from inventory, add to room
	const newInventory = inventory.filter(id => id !== itemId);
	const roomState = roomStates[currentRoomId] || {};
	const newRoomItems = [...(roomState.items || []), itemId];

	return {
		success: true,
		message: `You drop the ${itemData?.name || itemName}.`,
		newRoomItems,
		newInventory,
		itemId
	};
}

/**
 * Handle using an item
 */
export function handleUseItem(itemName, inventory, globalMeta) {
	// Find item in inventory
	const itemId = globalMeta.items?.find(
		i => (i.name.toUpperCase().includes(itemName) || i.id.toUpperCase() === itemName) &&
			inventory.includes(i.id)
	)?.id;

	if (!itemId) {
		return {
			success: false,
			message: `You don't have "${itemName}".`
		};
	}

	const itemData = globalMeta.items?.find(i => i.id === itemId);

	// Basic item effects (can be expanded)
	let effectMessage = `You use the ${itemData?.name || itemName}.`;
	let consumed = false;
	let newInventory = inventory;

	// Example effects based on item type/name
	if (itemName.includes('POTION') || itemName.includes('HEALTH')) {
		effectMessage = `You drink the ${itemData?.name}. You feel restored!`;
		consumed = true;
		newInventory = inventory.filter(id => id !== itemId);
	} else if (itemName.includes('KEY')) {
		effectMessage = `You hold the ${itemData?.name} ready.`;
	} else if (itemName.includes('TORCH')) {
		effectMessage = `You light the ${itemData?.name}. The area brightens.`;
	} else {
		effectMessage = `You examine the ${itemData?.name}. ${itemData?.description || 'Nothing special happens.'}`;
	}

	return {
		success: true,
		message: effectMessage,
		consumed,
		newInventory,
		itemId
	};
}

/**
 * Handle opening a chest
 */
export function handleOpenChestAction(room, roomState, inventory, globalMeta) {
	if (!room.meta?.hasChest) {
		return {
			success: false,
			message: 'There is no chest here.'
		};
	}

	if (roomState.chestOpened) {
		return {
			success: false,
			message: 'This chest has already been opened.'
		};
	}

	// Check if chest requires a key
	const requiredKey = room.meta?.chestRequiresKey;
	if (requiredKey && !inventory.includes(requiredKey)) {
		const keyData = globalMeta.items?.find(i => i.id === requiredKey);
		return {
			success: false,
			message: `The chest is locked. You need a ${keyData?.name || 'key'} to open it.`
		};
	}

	// Check if chest is guarded
	const guardian = room.meta?.chestGuardian;
	if (guardian && !(roomState.guardiansDefeated || []).includes(guardian)) {
		const guardianData = globalMeta.entities?.find(e => e.id === guardian);
		return {
			success: false,
			message: `The chest is guarded by ${guardianData?.name || 'something'}! You must defeat it first.`
		};
	}

	// Open the chest
	const contents = room.meta?.chestContents || [];
	const messages = ['You open the chest and find:'];
	contents.forEach(itemId => {
		const itemData = globalMeta.items?.find(i => i.id === itemId);
		messages.push(`  - ${itemData?.name || itemId}`);
	});

	return {
		success: true,
		messages,
		contents
	};
}

/**
 * Handle attacking an entity
 */
export function handleAttackEntity(targetName, room, roomState, inventory, globalMeta) {
	const entities = room.meta?.entities || [];
	const defeatedEntities = roomState.defeatedEntities || [];

	// Find target by name or id
	const targetId = globalMeta.entities?.find(
		e => (e.name.toUpperCase().includes(targetName) || e.id.toUpperCase() === targetName) &&
			entities.includes(e.id)
	)?.id;

	if (!targetId) {
		return {
			success: false,
			message: `There is no "${targetName}" here to attack.`
		};
	}

	const targetData = globalMeta.entities?.find(e => e.id === targetId);

	// Check if already defeated
	if (defeatedEntities.includes(targetId)) {
		return {
			success: false,
			message: `${targetData?.name || targetName} has already been defeated.`
		};
	}

	// Check if target is hostile
	if (targetData && !targetData.hostile) {
		return {
			success: false,
			message: `${targetData.name} is not hostile. You cannot attack them!`
		};
	}

	// Check if player has a weapon
	const hasWeapon = inventory.some(itemId => {
		const item = globalMeta.items?.find(i => i.id === itemId);
		return item?.name.toUpperCase().includes('SWORD') ||
			item?.name.toUpperCase().includes('WEAPON') ||
			item?.name.toUpperCase().includes('AXE') ||
			item?.name.toUpperCase().includes('DAGGER');
	});

	if (!hasWeapon) {
		return {
			success: false,
			message: `You need a weapon to attack ${targetData?.name || targetName}!`
		};
	}

	// Success - defeat the entity
	const messages = [
		`You attack ${targetData?.name || targetName} with your weapon!`,
		`After a brief fight, ${targetData?.name || targetName} is defeated!`
	];

	// Check if entity drops items
	const drops = targetData?.drops || [];
	const newRoomItems = [...(roomState.items || []), ...drops];

	if (drops.length > 0) {
		const itemNames = drops.map(id => {
			const itemData = globalMeta.items?.find(i => i.id === id);
			return itemData?.name || id;
		});
		messages.push(`${targetData?.name || targetName} drops: ${itemNames.join(', ')}`);
	}

	return {
		success: true,
		messages,
		targetId,
		drops,
		newRoomItems
	};
}

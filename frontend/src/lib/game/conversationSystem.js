/**
 * Conversation System
 * Handles NPC dialogue and conversation trees
 */

/**
 * Handle talking to an NPC
 */
export function handleConversation(npcName, room, roomState, globalMeta) {
	const entities = room.meta?.entities || [];

	// Find NPC by name or id
	const npcId = globalMeta.entities?.find(
		e => (e.name.toUpperCase().includes(npcName) || e.id.toUpperCase() === npcName) &&
			entities.includes(e.id)
	)?.id;

	if (!npcId) {
		return {
			success: false,
			message: `There is no one here called "${npcName}".`
		};
	}

	const npcData = globalMeta.entities?.find(e => e.id === npcId);

	// Check if room has a conversation
	if (!room.meta?.conversationId || !room.meta?.conversationState) {
		return {
			success: false,
			messages: [
				`You approach ${npcData?.name || npcId}.`,
				`They don't seem to have anything to say right now.`
			]
		};
	}

	const conversationState = room.meta.conversationState;
	const nodes = conversationState.nodes || [];
	const selectedNode = conversationState.selected || (nodes.length > 0 ? nodes[0].id : null);

	// Find the current node
	const currentNode = nodes.find(n => n.id === selectedNode);

	if (!currentNode) {
		return {
			success: false,
			messages: [
				`You approach ${npcData?.name || npcId}.`,
				`They don't seem to have anything to say right now.`
			]
		};
	}

	// Display the conversation
	const messages = [`\n${npcData?.name || npcId} says:`];
	messages.push(`"${currentNode.meta?.label || 'Hello.'}"`);

	// Find child nodes (options for player)
	const childNodes = nodes.filter(n => n.parentId === currentNode.id);

	if (childNodes.length > 0) {
		messages.push('');
		messages.push('You can respond:');
		childNodes.forEach((child, index) => {
			messages.push(`  ${index + 1}. ${child.meta?.label || 'Continue'}`);
		});
		messages.push('');
		messages.push('(Type the number of your response, or just continue exploring)');
	} else {
		messages.push('');
		messages.push('(End of conversation)');
	}

	return {
		success: true,
		messages,
		npcId,
		currentNode,
		childNodes
	};
}

/**
 * Handle selecting a conversation option by number
 */
export function handleConversationChoice(choiceNumber, room, roomState, globalMeta) {
	if (!room.meta?.conversationState) {
		return {
			success: false,
			message: 'No active conversation.'
		};
	}

	const conversationState = room.meta.conversationState;
	const nodes = conversationState.nodes || [];
	const selectedNode = conversationState.selected || (nodes.length > 0 ? nodes[0].id : null);

	const currentNode = nodes.find(n => n.id === selectedNode);
	if (!currentNode) {
		return {
			success: false,
			message: 'No active conversation node.'
		};
	}

	// Find child nodes
	const childNodes = nodes.filter(n => n.parentId === currentNode.id);
	const choiceIndex = choiceNumber - 1;

	if (choiceIndex < 0 || choiceIndex >= childNodes.length) {
		return {
			success: false,
			message: `Invalid choice. Please select a number between 1 and ${childNodes.length}.`
		};
	}

	const chosenNode = childNodes[choiceIndex];

	// Find NPC for response
	const entities = room.meta?.entities || [];
	const npcId = entities[0]; // Assume first entity is the conversation partner
	const npcData = globalMeta.entities?.find(e => e.id === npcId);

	// Display player's choice and NPC's response
	const messages = [
		`You say: "${chosenNode.meta?.label || 'Continue'}"`,
		'',
		`${npcData?.name || 'NPC'} says:`,
	];

	// Find grandchild nodes (NPC's responses to this choice)
	const responseNodes = nodes.filter(n => n.parentId === chosenNode.id);

	if (responseNodes.length > 0) {
		// Show first response
		messages.push(`"${responseNodes[0].meta?.label || '...'}"`);
		messages.push('');

		// Check if there are more branches
		const furtherChoices = nodes.filter(n => n.parentId === responseNodes[0].id);
		if (furtherChoices.length > 0) {
			messages.push('You can respond:');
			furtherChoices.forEach((choice, index) => {
				messages.push(`  ${index + 1}. ${choice.meta?.label || 'Continue'}`);
			});
			messages.push('');
			messages.push('(Type the number of your response, or just continue exploring)');
		} else {
			messages.push('(End of conversation)');
		}

		return {
			success: true,
			messages,
			newSelectedNode: responseNodes[0].id
		};
	} else {
		messages.push(`"${chosenNode.meta?.label || '...'}"`);
		messages.push('');
		messages.push('(End of conversation)');

		return {
			success: true,
			messages,
			newSelectedNode: chosenNode.id
		};
	}
}

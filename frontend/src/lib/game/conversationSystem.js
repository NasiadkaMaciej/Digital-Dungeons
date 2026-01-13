/**
 * Conversation System
 * Handles NPC dialogue and conversation trees
 */

/**
 * Helper: Find NPC in room by name
 */
function findNPC(npcName, room, globalMeta) {
	const entities = room.meta?.entities || [];
	return globalMeta.entities?.find(e => {
		const matches = e.name.toUpperCase().includes(npcName) || e.id.toUpperCase() === npcName;
		return matches && entities.includes(e.id);
	});
}

/**
 * Helper: Get conversation state
 */
function getConversationState(room) {
	if (!room.meta?.conversationState) return null;

	const state = room.meta.conversationState;
	const nodes = state.nodes || [];
	const selectedNode = state.selected || (nodes.length > 0 ? nodes[0].id : null);
	const currentNode = nodes.find(n => n.id === selectedNode);

	return { nodes, currentNode };
}

/**
 * Helper: Format conversation messages
 */
function formatConversation(npc, currentNode, childNodes) {
	const messages = [
		`\n${npc.name} says:`,
		`"${currentNode.meta?.label || 'Hello.'}"`
	];

	if (childNodes.length > 0) {
		messages.push('', 'You can respond:');
		childNodes.forEach((child, index) => {
			messages.push(`  ${index + 1}. ${child.meta?.label || 'Continue'}`);
		});
		messages.push('', '(Type the number of your response, or just continue exploring)');
	} else {
		messages.push('', '(End of conversation)');
	}

	return messages;
}

/**
 * Handle talking to an NPC
 */
export function handleConversation(npcName, room, roomState, globalMeta) {
	const npc = findNPC(npcName, room, globalMeta);
	if (!npc) {
		return { success: false, message: `There is no one here called "${npcName}".` };
	}

	const state = getConversationState(room);
	if (!state || !state.currentNode) {
		return {
			success: false,
			messages: [
				`You approach ${npc.name}.`,
				`They don't seem to have anything to say right now.`
			]
		};
	}

	const childNodes = state.nodes.filter(n => n.parentId === state.currentNode.id);

	return {
		success: true,
		messages: formatConversation(npc, state.currentNode, childNodes),
		npcId: npc.id,
		currentNode: state.currentNode,
		childNodes
	};
}

/**
 * Handle selecting a conversation option by number
 */
export function handleConversationChoice(choiceNumber, room, roomState, globalMeta) {
	const state = getConversationState(room);
	if (!state || !state.currentNode) {
		return { success: false, message: 'No active conversation.' };
	}

	const childNodes = state.nodes.filter(n => n.parentId === state.currentNode.id);
	const choiceIndex = choiceNumber - 1;

	if (choiceIndex < 0 || choiceIndex >= childNodes.length) {
		return {
			success: false,
			message: `Invalid choice. Please select a number between 1 and ${childNodes.length}.`
		};
	}

	const chosenNode = childNodes[choiceIndex];
	const entities = room.meta?.entities || [];
	const npcId = entities[0];
	const npc = globalMeta.entities?.find(e => e.id === npcId);

	const messages = [
		`You say: "${chosenNode.meta?.label || 'Continue'}"`,
		'',
		`${npc?.name || 'NPC'} says:`,
	];

	// Find NPC's response
	const responseNodes = state.nodes.filter(n => n.parentId === chosenNode.id);

	if (responseNodes.length > 0) {
		const response = responseNodes[0];
		messages.push(`"${response.meta?.label || '...'}"`);
		messages.push('');

		// Check for further choices
		const furtherChoices = state.nodes.filter(n => n.parentId === response.id);
		if (furtherChoices.length > 0) {
			messages.push('You can respond:');
			furtherChoices.forEach((choice, index) => {
				messages.push(`  ${index + 1}. ${choice.meta?.label || 'Continue'}`);
			});
			messages.push('', '(Type the number of your response, or just continue exploring)');
		} else {
			messages.push('(End of conversation)');
		}

		return { success: true, messages, newSelectedNode: response.id };
	}

	messages.push(`"${chosenNode.meta?.label || '...'}"`);
	messages.push('', '(End of conversation)');
	return { success: true, messages, newSelectedNode: chosenNode.id };
}

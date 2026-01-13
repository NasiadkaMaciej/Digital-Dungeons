'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { parseCommand } from '@/lib/game/commandParser';
import { useRouter } from "next/navigation";

const directionVectors = {
	N: { dx: 0, dy: -1 },
	NORTH: { dx: 0, dy: -1 },
	S: { dx: 0, dy: 1 },
	SOUTH: { dx: 0, dy: 1 },
	E: { dx: 1, dy: 0 },
	EAST: { dx: 1, dy: 0 },
	W: { dx: -1, dy: 0 },
	WEST: { dx: -1, dy: 0 },
};

function findRoomById(rooms, id) {
	return rooms?.find((r) => r.id === id) ?? null;
}

function findRoomByCoords(rooms, gx, gy) {
	return rooms?.find((r) => r.gx === gx && r.gy === gy) ?? null;
}

function describeRoom(room, roomState = {}, globalMeta = {}) {
	if (!room) return 'You are nowhere. This is probably a bug.';
	const desc =
		room.meta?.description ||
		"There is nothing remarkable about this place. The level designer hasn't done their job yet.";

	let fullDesc = `${desc}`;

	// List entities (NPCs) in the room
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

	// List items in the room (from room state)
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

export default function GameConsole({ initialData }) {
	const router = useRouter();

	const handleExit = useCallback(() => {
		// TODO: persist game state before leaving
		router.push('/');
	}, [router]);

	const rooms = initialData?.rooms ?? [];
	const globalMeta = initialData?.globalMeta ?? {};
	const startingRoomId =
		initialData?.selected || (rooms.length > 0 ? rooms[0].id : null);

	const [currentRoomId, setCurrentRoomId] = useState(startingRoomId);
	const [inventory, setInventory] = useState([]);
	const [roomStates, setRoomStates] = useState({});
	const [log, setLog] = useState([]);
	const [input, setInput] = useState('');
	const inputRef = useRef(null);
	const logEndRef = useRef(null);

	// Focus the input on mount and whenever it loses focus
	const focusInput = useCallback(() => {
		if (inputRef.current) {
			inputRef.current.focus();
			// Move caret to the end just in case
			const len = inputRef.current.value.length;
			inputRef.current.setSelectionRange(len, len);
		}
	}, []);

	useEffect(() => {
		focusInput();
	}, [focusInput]);

	// Also re-focus on any click inside the console
	const handleContainerClick = () => {
		focusInput();
	};

	// Scroll to bottom when log changes
	useEffect(() => {
		if (logEndRef.current) {
			logEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
		}
	}, [log]);

	// Initial intro message
	useEffect(() => {
		// Initialize room states with items from room meta and global meta
		const initialRoomStates = {};
		rooms.forEach(room => {
			// Start with items defined directly in room meta
			const roomItems = [...(room.meta?.items || [])];

			// Don't add random items from chests on init - they'll be added when chest is opened
			initialRoomStates[room.id] = {
				items: roomItems,
				chestOpened: false,
				visitedConversations: {}
			};
		});
		setRoomStates(initialRoomStates);

		const room = findRoomById(rooms, startingRoomId);
		const initialMessages = [];

		initialMessages.push('WELCOME TO THE DIGITAL DUNGEONS.');
		initialMessages.push('TYPE HELP FOR AVAILABLE COMMANDS.');
		initialMessages.push('');
		initialMessages.push(describeRoom(room, initialRoomStates[startingRoomId] || {}, globalMeta));

		setLog(initialMessages);
	}, [rooms, startingRoomId, globalMeta]);

	const appendToLog = useCallback((lines) => {
		setLog((prev) => [...prev, ...lines]);
	}, []);

	const handleMove = useCallback(
		(directionKey) => {
			const room = findRoomById(rooms, currentRoomId);
			if (!room) {
				appendToLog([
					'You flail around in the void. There is nowhere to go from here.',
				]);
				return;
			}

			const vec = directionVectors[directionKey];
			if (!vec) {
				appendToLog([`You cannot go "${directionKey}".`]);
				return;
			}

			const target = findRoomByCoords(
				rooms,
				room.gx + vec.dx,
				room.gy + vec.dy,
			);

			if (!target) {
				appendToLog(['You cannot go that way.']);
				return;
			}

			setCurrentRoomId(target.id);
			appendToLog(['', describeRoom(target, roomStates[target.id] || {}, globalMeta)]);
		},
		[rooms, currentRoomId, roomStates, globalMeta, appendToLog],
	);

	const handleHelp = useCallback(() => {
		appendToLog([
			'AVAILABLE COMMANDS:',
			'  HELP / H           - Show this help.',
			'  LOOK / L           - Re-describe your current location.',
			'  N / S / E / W      - Move north, south, east, or west.',
			'  GO NORTH|SOUTH...  - Verbose movement, same as N/S/E/W.',
			'  INVENTORY / INV / I - Show your inventory.',
			'  TAKE <item>        - Pick up an item.',
			'  DROP <item>        - Drop an item from inventory.',
			'  USE <item>         - Use an item from inventory.',
			'  OPEN CHEST         - Open a chest in the room.',
			'  TALK <npc>         - Talk to an NPC.',
			'  EXAMINE <item/npc> - Examine an item or NPC closely.',
			'  ATTACK <enemy>     - Attack an enemy (requires weapon).',
		]);
	}, [appendToLog]);

	const handleLook = useCallback(() => {
		const room = findRoomById(rooms, currentRoomId);
		appendToLog(['', describeRoom(room, roomStates[currentRoomId] || {}, globalMeta)]);
	}, [rooms, currentRoomId, roomStates, globalMeta, appendToLog]);

	const handleInventory = useCallback(() => {
		if (inventory.length === 0) {
			appendToLog(['', 'Your inventory is empty.']);
			return;
		}

		const itemDescs = inventory.map(itemId => {
			const itemData = globalMeta.items?.find(i => i.id === itemId);
			if (itemData) {
				return `  ${itemData.name} - ${itemData.description}`;
			}
			return `  ${itemId}`;
		});

		appendToLog(['', 'INVENTORY:', ...itemDescs]);
	}, [inventory, globalMeta, appendToLog]);

	const handleTake = useCallback((itemName) => {
		if (!itemName) {
			appendToLog(['Take what?']);
			return;
		}

		const room = findRoomById(rooms, currentRoomId);
		const roomState = roomStates[currentRoomId] || {};
		const roomItems = roomState.items || [];

		// Find item by name or id
		const itemId = globalMeta.items?.find(
			i => i.name.toUpperCase() === itemName || i.id.toUpperCase() === itemName
		)?.id;

		if (!itemId || !roomItems.includes(itemId)) {
			appendToLog([`There is no "${itemName}" here to take.`]);
			return;
		}

		// Remove item from room and add to inventory
		const newRoomItems = roomItems.filter(i => i !== itemId);
		setRoomStates(prev => ({
			...prev,
			[currentRoomId]: {
				...roomState,
				items: newRoomItems
			}
		}));
		setInventory(prev => [...prev, itemId]);

		const itemData = globalMeta.items?.find(i => i.id === itemId);
		appendToLog([`You take the ${itemData?.name || itemId}.`]);
	}, [rooms, currentRoomId, roomStates, globalMeta, appendToLog]);

	const handleDrop = useCallback((itemName) => {
		if (!itemName) {
			appendToLog(['Drop what?']);
			return;
		}

		// Find item in inventory by name or id
		const itemId = globalMeta.items?.find(
			i => (i.name.toUpperCase() === itemName || i.id.toUpperCase() === itemName) &&
				inventory.includes(i.id)
		)?.id;

		if (!itemId) {
			appendToLog([`You don't have "${itemName}" in your inventory.`]);
			return;
		}

		// Remove from inventory and add to room
		setInventory(prev => prev.filter(i => i !== itemId));
		const roomState = roomStates[currentRoomId] || {};
		setRoomStates(prev => ({
			...prev,
			[currentRoomId]: {
				...roomState,
				items: [...(roomState.items || []), itemId]
			}
		}));

		const itemData = globalMeta.items?.find(i => i.id === itemId);
		appendToLog([`You drop the ${itemData?.name || itemId}.`]);
	}, [inventory, currentRoomId, roomStates, globalMeta, appendToLog]);

	const handleUse = useCallback((itemName) => {
		if (!itemName) {
			appendToLog(['Use what?']);
			return;
		}

		// Find item in inventory
		const itemId = globalMeta.items?.find(
			i => (i.name.toUpperCase() === itemName || i.id.toUpperCase() === itemName) &&
				inventory.includes(i.id)
		)?.id;

		if (!itemId) {
			appendToLog([`You don't have "${itemName}" in your inventory.`]);
			return;
		}

		const itemData = globalMeta.items?.find(i => i.id === itemId);

		// Basic use mechanics
		if (itemId.includes('potion') || itemId.includes('health')) {
			appendToLog([`You drink the ${itemData?.name}. You feel refreshed!`]);
			setInventory(prev => prev.filter(i => i !== itemId));
		} else if (itemId.includes('key')) {
			appendToLog([`You hold the ${itemData?.name}. It might unlock something...`]);
		} else if (itemId.includes('torch')) {
			appendToLog([`You light the ${itemData?.name}. The area brightens.`]);
		} else {
			appendToLog([`You're not sure how to use the ${itemData?.name || itemId}.`]);
		}
	}, [inventory, globalMeta, appendToLog]);

	const handleOpenChest = useCallback(() => {
		const room = findRoomById(rooms, currentRoomId);
		const roomState = roomStates[currentRoomId] || {};

		if (!room.meta?.hasChest) {
			appendToLog(['There is no chest here.']);
			return;
		}

		if (roomState.chestOpened) {
			appendToLog(['The chest is already open and empty.']);
			return;
		}

		// Check if chest requires a key
		const requiredKey = room.meta?.chestRequiresKey;
		if (requiredKey && !inventory.includes(requiredKey)) {
			const keyData = globalMeta.items?.find(i => i.id === requiredKey);
			appendToLog([`The chest is locked. You need a ${keyData?.name || 'key'} to open it.`]);
			return;
		}

		// Check if there's a guardian blocking the chest
		const guardian = room.meta?.chestGuardian;
		if (guardian && !roomState.guardiansDefeated?.includes(guardian)) {
			const guardianData = globalMeta.entities?.find(e => e.id === guardian);
			appendToLog([`${guardianData?.name || 'A creature'} blocks your path to the chest!`]);
			return;
		}

		// Determine chest contents - use predefined or random
		let chestItems = [];
		if (room.meta?.chestContents && room.meta.chestContents.length > 0) {
			chestItems = [...room.meta.chestContents];
		} else {
			const allItems = globalMeta.items || [];
			if (allItems.length > 0) {
				// Add 1-3 random items
				const numItems = Math.min(3, allItems.length);
				for (let i = 0; i < numItems; i++) {
					const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
					if (randomItem && !chestItems.includes(randomItem.id)) {
						chestItems.push(randomItem.id);
					}
				}
			}
		}

		setRoomStates(prev => ({
			...prev,
			[currentRoomId]: {
				...roomState,
				chestOpened: true,
				items: [...(roomState.items || []), ...chestItems]
			}
		}));

		if (chestItems.length > 0) {
			const itemNames = chestItems.map(id => {
				const itemData = globalMeta.items?.find(i => i.id === id);
				return itemData?.name || id;
			});
			appendToLog([
				'You open the chest and find:',
				...itemNames.map(name => `  - ${name}`)
			]);
		} else {
			appendToLog(['You open the chest, but it\'s empty.']);
		}
	}, [rooms, currentRoomId, roomStates, inventory, globalMeta, appendToLog]);

	const handleAttack = useCallback((targetName) => {
		if (!targetName) {
			appendToLog(['Attack what?']);
			return;
		}

		const room = findRoomById(rooms, currentRoomId);
		const roomState = roomStates[currentRoomId] || {};
		const entities = room.meta?.entities || [];

		// Find target by name or id
		const targetId = globalMeta.entities?.find(
			e => (e.name.toUpperCase().includes(targetName) || e.id.toUpperCase() === targetName) &&
				entities.includes(e.id)
		)?.id;

		if (!targetId) {
			appendToLog([`There is no "${targetName}" here to attack.`]);
			return;
		}

		const targetData = globalMeta.entities?.find(e => e.id === targetId);

		// Check if target can be attacked
		if (targetData?.type === 'person' && !targetData.hostile) {
			appendToLog([`You cannot attack ${targetData.name}! They are not hostile.`]);
			return;
		}

		// Check if already defeated
		if (roomState.defeatedEntities?.includes(targetId)) {
			appendToLog([`The ${targetData?.name || targetName} is already defeated.`]);
			return;
		}

		// Check if player has a weapon
		const hasWeapon = inventory.some(itemId => {
			const item = globalMeta.items?.find(i => i.id === itemId);
			return item && (item.id.includes('sword') || item.id.includes('weapon') ||
				item.name.toLowerCase().includes('sword') || item.name.toLowerCase().includes('weapon'));
		});

		if (!hasWeapon) {
			appendToLog([`You need a weapon to attack ${targetData?.name || targetName}!`]);
			return;
		}

		// Defeat the entity
		const defeatedEntities = [...(roomState.defeatedEntities || []), targetId];
		const guardiansDefeated = [...(roomState.guardiansDefeated || []), targetId];

		// Check if defeated enemy drops items
		const droppedItems = [];
		if (targetId === 'treasure_goblin') {
			droppedItems.push('goblin_key');
		}

		setRoomStates(prev => ({
			...prev,
			[currentRoomId]: {
				...roomState,
				defeatedEntities,
				guardiansDefeated,
				items: [...(roomState.items || []), ...droppedItems]
			}
		}));

		const messages = [
			`You attack ${targetData?.name || targetName} with your weapon!`,
			`After a brief fight, ${targetData?.name || targetName} is defeated!`
		];

		if (droppedItems.length > 0) {
			const itemNames = droppedItems.map(id => {
				const itemData = globalMeta.items?.find(i => i.id === id);
				return itemData?.name || id;
			});
			messages.push(`${targetData?.name || targetName} drops: ${itemNames.join(', ')}`);
		}

		appendToLog(messages);
	}, [rooms, currentRoomId, roomStates, inventory, globalMeta, appendToLog]);

	const handleTalk = useCallback((npcName) => {
		if (!npcName) {
			appendToLog(['Talk to whom?']);
			return;
		}

		const room = findRoomById(rooms, currentRoomId);
		const roomState = roomStates[currentRoomId] || {};
		const entities = room.meta?.entities || [];

		// Find NPC by name or id
		const npcId = globalMeta.entities?.find(
			e => (e.name.toUpperCase().includes(npcName) || e.id.toUpperCase() === npcName) &&
				entities.includes(e.id)
		)?.id;

		if (!npcId) {
			appendToLog([`There is no one here called "${npcName}".`]);
			return;
		}

		const npcData = globalMeta.entities?.find(e => e.id === npcId);

		// Check if room has a conversation
		if (room.meta?.conversationId && room.meta?.conversationState) {
			const conversationState = room.meta.conversationState;
			const nodes = conversationState.nodes || [];
			const selectedNode = conversationState.selected || (nodes.length > 0 ? nodes[0].id : null);

			// Find the current node
			const currentNode = nodes.find(n => n.id === selectedNode);

			if (!currentNode) {
				appendToLog([
					`You approach ${npcData?.name || npcId}.`,
					`They don't seem to have anything to say right now.`
				]);
				return;
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

			appendToLog(messages);

			// Mark conversation as visited for repeatable check
			if (!room.meta.conversationRepeatable) {
				setRoomStates(prev => ({
					...prev,
					[currentRoomId]: {
						...roomState,
						visitedConversations: {
							...roomState.visitedConversations,
							[room.meta.conversationId]: true
						}
					}
				}));
			}
		} else {
			// Generic NPC interaction
			const greetings = [
				`${npcData?.name || npcId} nods at you.`,
				`${npcData?.name || npcId} says: "Hello, traveler."`,
				`${npcData?.name || npcId} looks at you quietly.`,
				`${npcData?.name || npcId} greets you warmly.`
			];
			appendToLog([greetings[Math.floor(Math.random() * greetings.length)]]);
		}
	}, [rooms, currentRoomId, roomStates, globalMeta, appendToLog, setRoomStates]);

	const handleExamine = useCallback((targetName) => {
		if (!targetName) {
			appendToLog(['Examine what?']);
			return;
		}

		const room = findRoomById(rooms, currentRoomId);
		const roomState = roomStates[currentRoomId] || {};

		// Check items in room
		const roomItems = roomState.items || [];
		const roomItemData = globalMeta.items?.find(
			i => (i.name.toUpperCase().includes(targetName) || i.id.toUpperCase() === targetName) &&
				roomItems.includes(i.id)
		);

		if (roomItemData) {
			appendToLog([
				`${roomItemData.name}:`,
				`  ${roomItemData.description}`
			]);
			return;
		}

		// Check items in inventory
		const invItemData = globalMeta.items?.find(
			i => (i.name.toUpperCase().includes(targetName) || i.id.toUpperCase() === targetName) &&
				inventory.includes(i.id)
		);

		if (invItemData) {
			appendToLog([
				`${invItemData.name}:`,
				`  ${invItemData.description}`
			]);
			return;
		}

		// Check NPCs
		const entities = room.meta?.entities || [];
		const npcData = globalMeta.entities?.find(
			e => (e.name.toUpperCase().includes(targetName) || e.id.toUpperCase() === targetName) &&
				entities.includes(e.id)
		);

		if (npcData) {
			appendToLog([
				`${npcData.name} (${npcData.type}):`,
				`  A ${npcData.type} standing before you.`
			]);
			return;
		}

		appendToLog([`You don't see "${targetName}" here.`]);
	}, [rooms, currentRoomId, roomStates, inventory, globalMeta, appendToLog]);

	const handleCommand = useCallback(
		(raw) => {
			const cmd = parseCommand(raw);
			if (!cmd) return;

			const { verb, args } = cmd;

			// movement shorthands (N, S, E, W)
			if (['N', 'S', 'E', 'W', 'NORTH', 'SOUTH', 'EAST', 'WEST'].includes(verb)) {
				handleMove(verb);
				return;
			}

			// GO <direction>
			if (verb === 'GO' && args.length > 0) {
				const dir = args[0];
				handleMove(dir);
				return;
			}

			if (verb === 'LOOK' || verb === 'L') {
				handleLook();
				return;
			}

			if (verb === 'HELP' || verb === 'H') {
				handleHelp();
				return;
			}

			if (verb === 'INVENTORY' || verb === 'INV' || verb === 'I') {
				handleInventory();
				return;
			}

			if (verb === 'TAKE' || verb === 'GET' || verb === 'PICKUP') {
				const itemName = args.join(' ');
				handleTake(itemName);
				return;
			}

			if (verb === 'DROP') {
				const itemName = args.join(' ');
				handleDrop(itemName);
				return;
			}

			if (verb === 'USE') {
				const itemName = args.join(' ');
				handleUse(itemName);
				return;
			}

			if (verb === 'OPEN' && args.length > 0 && args[0] === 'CHEST') {
				handleOpenChest();
				return;
			}

			if (verb === 'TALK' || verb === 'SPEAK') {
				const npcName = args.join(' ');
				handleTalk(npcName);
				return;
			}

			if (verb === 'EXAMINE' || verb === 'INSPECT' || verb === 'X') {
				const targetName = args.join(' ');
				handleExamine(targetName);
				return;
			}

			if (verb === 'ATTACK') {
				const targetName = args.join(' ');
				handleAttack(targetName);
				return;
			}

			// Check if it's a number (for dialog choices)
			if (/^\d+$/.test(verb)) {
				const choice = parseInt(verb, 10);
				const room = findRoomById(rooms, currentRoomId);

				if (room?.meta?.conversationState) {
					const conversationState = room.meta.conversationState;
					const nodes = conversationState.nodes || [];
					const selectedNode = conversationState.selected || (nodes.length > 0 ? nodes[0].id : null);
					const currentNode = nodes.find(n => n.id === selectedNode);

					if (currentNode) {
						const childNodes = nodes.filter(n => n.parentId === currentNode.id);

						if (choice > 0 && choice <= childNodes.length) {
							const chosenNode = childNodes[choice - 1];

							// Display player's choice
							appendToLog([
								`You say: "${chosenNode.meta?.label || 'Continue'}"`,
								''
							]);

							// Find the NPC in this room
							const entities = room.meta?.entities || [];
							const npcData = globalMeta.entities?.find(e => entities.includes(e.id));

							// Find response nodes (children of chosen node)
							const responseNodes = nodes.filter(n => n.parentId === chosenNode.id);

							if (responseNodes.length > 0) {
								// Display NPC's response
								const responseNode = responseNodes[0]; // Take first response
								const messages = [`${npcData?.name || 'NPC'} says:`];
								messages.push(`"${responseNode.meta?.label || 'I see.'}"`);

								// Check if there are more options
								const nextOptions = nodes.filter(n => n.parentId === responseNode.id);
								if (nextOptions.length > 0) {
									messages.push('');
									messages.push('Continue the conversation with TALK command.');
								} else {
									messages.push('');
									messages.push('(End of conversation)');
								}

								appendToLog(messages);
							}

							return;
						}
					}
				}

				appendToLog([`Invalid choice: ${choice}`]);
				return;
			}

			// Unknown command
			appendToLog([`I don't recognise that command: "${cmd.raw}".`]);
		},
		[handleMove, handleLook, handleHelp, handleInventory, handleTake,
			handleDrop, handleUse, handleOpenChest, handleTalk, handleExamine, handleAttack,
			rooms, currentRoomId, globalMeta, appendToLog],
	); const handleSubmit = (event) => {
		event.preventDefault();
		const trimmed = input.trim();
		if (!trimmed) {
			setInput('');
			return;
		}

		// Echo the command into the log as a prompt line
		appendToLog([`> ${trimmed.toUpperCase()}`]);

		// Handle the command
		handleCommand(trimmed);

		// Clear input for the next command
		setInput('');
	};

	const handleInputChange = (event) => {
		// Force uppercase as the user types
		const value = event.target.value.toUpperCase();
		setInput(value);
	};

	const handleInputBlur = () => {
		setTimeout(focusInput, 0);
	};

	// Disable scroll on mount, restore on unmount
	useEffect(() => {
		const original = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = original;
		};
	}, []);

	return (
		<div
			className="min-h-screen flex flex-col bg-black text-white font-mono"
			onClick={handleContainerClick}
		>
			{/* Exit button */}
			<div className="absolute top-3 right-4 z-[1000000]">
				<button
					type="button"
					onClick={handleExit}
					className="px-3 py-1 text-xs border border-neutral-600 bg-neutral-900 hover:bg-neutral-800 transition-colors cursor-pointer"
				>
					SAVE &amp; QUIT
				</button>
			</div>

			{/* Log / output area */}
			<div className="flex-1 overflow-y-auto p-4">
				{log.map((line, index) => (
					<div key={index} className="whitespace-pre-wrap">
						{line}
					</div>
				))}
				<div ref={logEndRef} />
			</div>

			{/* Input bar glued to the bottom */}
			<form
				onSubmit={handleSubmit}
				className="border-t border-neutral-700 px-4 py-2"
			>
				<div className="flex items-center gap-2">
					<span className="text-neutral-500 select-none">{'>'}</span>
					<input
						ref={inputRef}
						type="text"
						className="flex-1 bg-black text-white font-mono outline-none border-none uppercase"
						autoComplete="off"
						autoCorrect="off"
						autoCapitalize="characters"
						spellCheck={false}
						value={input}
						onChange={handleInputChange}
						onBlur={handleInputBlur}
					/>
				</div>
			</form>
		</div>
	);
}
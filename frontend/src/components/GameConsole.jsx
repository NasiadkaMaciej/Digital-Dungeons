'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseCommand } from '@/lib/game/commandParser';
import {
	directionVectors,
	findRoomById,
	findRoomByCoords,
	describeRoom,
	initializeRoomStates
} from '@/lib/game/roomHelpers';
import {
	handleTakeItem,
	handleDropItem,
	handleUseItem,
	handleOpenChestAction,
	handleAttackEntity
} from '@/lib/game/gameActions';
import {
	handleConversation,
	handleConversationChoice
} from '@/lib/game/conversationSystem';

export default function GameConsole({ initialData }) {
	const router = useRouter();

	// ===== GAME DATA =====
	const rooms = initialData?.rooms ?? [];
	const globalMeta = initialData?.globalMeta ?? {};
	const startingRoomId = initialData?.selected || (rooms.length > 0 ? rooms[0].id : null);

	// ===== STATE =====
	const [currentRoomId, setCurrentRoomId] = useState(startingRoomId);
	const [inventory, setInventory] = useState([]);
	const [roomStates, setRoomStates] = useState({});
	const [log, setLog] = useState([]);
	const [input, setInput] = useState('');

	// ===== REFS =====
	const inputRef = useRef(null);
	const logEndRef = useRef(null);
	const logContainerRef = useRef(null);

	// ===== UTILITY FUNCTIONS =====
	const appendToLog = useCallback((lines) => {
		setLog((prev) => [...prev, ...lines]);
	}, []);

	const focusInput = useCallback(() => {
		if (inputRef.current) {
			inputRef.current.focus();
			const len = inputRef.current.value.length;
			inputRef.current.setSelectionRange(len, len);
		}
	}, []);

	// ===== INITIALIZATION =====
	useEffect(() => {
		// Initialize room states
		const initialRoomStates = initializeRoomStates(rooms);
		setRoomStates(initialRoomStates);

		// Show welcome message
		const room = findRoomById(rooms, startingRoomId);
		const initialMessages = [
			'WELCOME TO THE DIGITAL DUNGEONS.',
			'TYPE HELP FOR AVAILABLE COMMANDS.',
			'',
			describeRoom(room, initialRoomStates[startingRoomId] || {}, globalMeta)
		];
		setLog(initialMessages);
	}, [rooms, startingRoomId, globalMeta]);

	// Auto-focus input
	useEffect(() => {
		focusInput();
	}, [focusInput]);

	// Auto-scroll log to bottom after each update (keeps input visible)
	useEffect(() => {
		// Use setTimeout to ensure DOM is fully updated and rendered
		const scrollToBottom = () => {
			if (logContainerRef.current) {
				logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
			}
		};

		// Try multiple times to ensure scroll happens even with slow rendering
		requestAnimationFrame(scrollToBottom);
		const timer = setTimeout(scrollToBottom, 50);

		return () => clearTimeout(timer);
	}, [log]);

	// Disable body scroll
	useEffect(() => {
		const original = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = original;
		};
	}, []);

	// ===== COMMAND HANDLERS =====
	const handleExit = useCallback(() => {
		// TODO: persist game state before leaving
		router.push('/');
	}, [router]);

	const handleMove = useCallback((directionKey) => {
		const room = findRoomById(rooms, currentRoomId);
		if (!room) {
			appendToLog(['You flail around in the void. There is nowhere to go from here.']);
			return;
		}

		const vec = directionVectors[directionKey];
		if (!vec) {
			appendToLog([`You cannot go "${directionKey}".`]);
			return;
		}

		const target = findRoomByCoords(rooms, room.gx + vec.dx, room.gy + vec.dy);
		if (!target) {
			appendToLog(['You cannot go that way.']);
			return;
		}

		setCurrentRoomId(target.id);
		appendToLog(['', describeRoom(target, roomStates[target.id] || {}, globalMeta)]);
	}, [rooms, currentRoomId, roomStates, globalMeta, appendToLog]);

	const handleHelp = useCallback(() => {
		appendToLog([
			'AVAILABLE COMMANDS:',
			'  HELP / H           - Show this help.',
			'  LOOK / L           - Re-describe your current location.',
			'  N / S / E / W      - Move north, south, east, or west.',
			'  GO NORTH|SOUTH...  - Verbose movement, same as N/S/E/W.',
			'  INVENTORY / INV / I - Show your inventory.',
			'  TAKE <item>        - Pick up an item.',
			'  DROP <item>        - Drop an item from your inventory.',
			'  USE <item>         - Use an item.',
			'  EXAMINE <target>   - Examine an item or NPC closely.',
			'  TALK <npc>         - Talk to an NPC.',
			'  <number>           - Select a dialogue option.',
			'  ATTACK <enemy>     - Attack an enemy.',
			'  OPEN CHEST         - Open a chest in the room.',
			'  QUIT / EXIT        - Save and quit the game.',
		]);
	}, [appendToLog]);

	const handleLook = useCallback(() => {
		const room = findRoomById(rooms, currentRoomId);
		appendToLog(['', describeRoom(room, roomStates[currentRoomId] || {}, globalMeta)]);
	}, [rooms, currentRoomId, roomStates, globalMeta, appendToLog]);

	const handleInventory = useCallback(() => {
		if (inventory.length === 0) {
			appendToLog(['', 'INVENTORY:', '  (empty)']);
			return;
		}

		const lines = ['', 'INVENTORY:'];
		inventory.forEach(itemId => {
			const itemData = globalMeta.items?.find(i => i.id === itemId);
			const name = itemData?.name || itemId;
			const desc = itemData?.description || '';
			lines.push(`  ${name}${desc ? ' - ' + desc : ''}`);
		});
		appendToLog(lines);
	}, [inventory, globalMeta, appendToLog]);

	const handleTake = useCallback((itemName) => {
		if (!itemName) {
			appendToLog(['Take what?']);
			return;
		}

		const result = handleTakeItem(itemName, currentRoomId, roomStates, inventory, globalMeta);

		if (!result.success) {
			appendToLog([result.message]);
			return;
		}

		// Update room state and inventory
		setRoomStates(prev => ({
			...prev,
			[currentRoomId]: {
				...prev[currentRoomId],
				items: result.newRoomItems
			}
		}));
		setInventory(result.newInventory);
		appendToLog([result.message]);
	}, [currentRoomId, roomStates, inventory, globalMeta, appendToLog]);

	const handleDrop = useCallback((itemName) => {
		if (!itemName) {
			appendToLog(['Drop what?']);
			return;
		}

		const result = handleDropItem(itemName, currentRoomId, roomStates, inventory, globalMeta);

		if (!result.success) {
			appendToLog([result.message]);
			return;
		}

		// Update room state and inventory
		setRoomStates(prev => ({
			...prev,
			[currentRoomId]: {
				...prev[currentRoomId],
				items: result.newRoomItems
			}
		}));
		setInventory(result.newInventory);
		appendToLog([result.message]);
	}, [currentRoomId, roomStates, inventory, globalMeta, appendToLog]);

	const handleUse = useCallback((itemName) => {
		if (!itemName) {
			appendToLog(['Use what?']);
			return;
		}

		const result = handleUseItem(itemName, inventory, globalMeta);

		if (!result.success) {
			appendToLog([result.message]);
			return;
		}

		if (result.consumed) {
			setInventory(result.newInventory);
		}
		appendToLog([result.message]);
	}, [inventory, globalMeta, appendToLog]);

	const handleOpenChest = useCallback(() => {
		const room = findRoomById(rooms, currentRoomId);
		const roomState = roomStates[currentRoomId] || {};

		const result = handleOpenChestAction(room, roomState, inventory, globalMeta);

		if (!result.success) {
			appendToLog([result.message]);
			return;
		}

		// Mark chest as opened and add items to room
		setRoomStates(prev => ({
			...prev,
			[currentRoomId]: {
				...prev[currentRoomId],
				chestOpened: true,
				items: [...(prev[currentRoomId]?.items || []), ...result.contents]
			}
		}));

		appendToLog(result.messages);
	}, [rooms, currentRoomId, roomStates, inventory, globalMeta, appendToLog]);

	const handleAttack = useCallback((targetName) => {
		if (!targetName) {
			appendToLog(['Attack whom?']);
			return;
		}

		const room = findRoomById(rooms, currentRoomId);
		const roomState = roomStates[currentRoomId] || {};

		const result = handleAttackEntity(targetName, room, roomState, inventory, globalMeta);

		if (!result.success) {
			appendToLog([result.message]);
			return;
		}

		// Update room state - mark entity as defeated and add dropped items
		setRoomStates(prev => ({
			...prev,
			[currentRoomId]: {
				...prev[currentRoomId],
				defeatedEntities: [...(prev[currentRoomId]?.defeatedEntities || []), result.targetId],
				guardiansDefeated: [...(prev[currentRoomId]?.guardiansDefeated || []), result.targetId],
				items: result.newRoomItems
			}
		}));

		appendToLog(result.messages);
	}, [rooms, currentRoomId, roomStates, inventory, globalMeta, appendToLog]);

	const handleTalk = useCallback((npcName) => {
		if (!npcName) {
			appendToLog(['Talk to whom?']);
			return;
		}

		const room = findRoomById(rooms, currentRoomId);
		const roomState = roomStates[currentRoomId] || {};

		const result = handleConversation(npcName, room, roomState, globalMeta);

		if (!result.success) {
			appendToLog(result.messages || [result.message]);
			return;
		}

		appendToLog(result.messages);
	}, [rooms, currentRoomId, roomStates, globalMeta, appendToLog]);

	const handleExamine = useCallback((targetName) => {
		if (!targetName) {
			appendToLog(['Examine what?']);
			return;
		}

		const room = findRoomById(rooms, currentRoomId);
		const roomState = roomStates[currentRoomId] || {};

		// Check items in room
		const roomItems = roomState.items || [];
		const itemId = globalMeta.items?.find(
			i => (i.name.toUpperCase().includes(targetName) || i.id.toUpperCase() === targetName) &&
				roomItems.includes(i.id)
		)?.id;

		if (itemId) {
			const itemData = globalMeta.items?.find(i => i.id === itemId);
			appendToLog([
				`${itemData?.name || targetName}:`,
				`  ${itemData?.description || 'A normal item.'}`
			]);
			return;
		}

		// Check items in inventory
		const invItemId = globalMeta.items?.find(
			i => (i.name.toUpperCase().includes(targetName) || i.id.toUpperCase() === targetName) &&
				inventory.includes(i.id)
		)?.id;

		if (invItemId) {
			const itemData = globalMeta.items?.find(i => i.id === invItemId);
			appendToLog([
				`${itemData?.name || targetName}:`,
				`  ${itemData?.description || 'A normal item.'}`
			]);
			return;
		}

		// Check entities in room
		const entities = room.meta?.entities || [];
		const entityId = globalMeta.entities?.find(
			e => (e.name.toUpperCase().includes(targetName) || e.id.toUpperCase() === targetName) &&
				entities.includes(e.id)
		)?.id;

		if (entityId) {
			const entityData = globalMeta.entities?.find(e => e.id === entityId);
			const typeDesc = entityData?.type === 'person' ? 'person' :
				entityData?.type === 'monster' ? 'monster' : 'creature';
			appendToLog([
				`${entityData?.name || targetName} (${typeDesc}):`,
				`  ${entityData?.description || 'A ' + typeDesc + ' standing before you.'}`
			]);
			return;
		}

		appendToLog([`You don't see any "${targetName}" here.`]);
	}, [rooms, currentRoomId, roomStates, inventory, globalMeta, appendToLog]);

	const handleCommand = useCallback((raw) => {
		const cmd = parseCommand(raw);

		// Join args array into a single string
		const argsString = cmd.args?.join(' ') || '';

		// Movement commands
		if (directionVectors[cmd.verb]) {
			handleMove(cmd.verb);
			return;
		}

		// Conversation choice (numeric input)
		if (/^\d+$/.test(cmd.verb)) {
			const choiceNumber = parseInt(cmd.verb, 10);
			const room = findRoomById(rooms, currentRoomId);
			const roomState = roomStates[currentRoomId] || {};

			const result = handleConversationChoice(choiceNumber, room, roomState, globalMeta);

			if (!result.success) {
				appendToLog([result.message]);
				return;
			}

			// Update conversation state if needed
			if (result.newSelectedNode) {
				setRoomStates(prev => ({
					...prev,
					[currentRoomId]: {
						...prev[currentRoomId],
						conversationSelected: result.newSelectedNode
					}
				}));
			}

			appendToLog(result.messages);
			return;
		}

		// Other commands
		switch (cmd.verb) {
			case 'HELP':
			case 'H':
				handleHelp();
				return;
			case 'LOOK':
			case 'L':
				handleLook();
				return;
			case 'INVENTORY':
			case 'INV':
			case 'I':
				handleInventory();
				return;
			case 'TAKE':
			case 'GET':
			case 'PICKUP':
				handleTake(argsString);
				return;
			case 'DROP':
				handleDrop(argsString);
				return;
			case 'USE':
				handleUse(argsString);
				return;
			case 'EXAMINE':
			case 'INSPECT':
			case 'X':
				handleExamine(argsString);
				return;
			case 'TALK':
			case 'SPEAK':
				handleTalk(argsString);
				return;
			case 'ATTACK':
			case 'KILL':
			case 'FIGHT':
				handleAttack(argsString);
				return;
			case 'OPEN':
				if (argsString.includes('CHEST')) {
					handleOpenChest();
					return;
				}
				break;
			case 'GO':
				if (directionVectors[argsString]) {
					handleMove(argsString);
					return;
				}
				break;
			case 'QUIT':
			case 'EXIT':
				handleExit();
				return;
		}

		// Unknown command
		appendToLog([`I don't recognise that command: "${cmd.raw}".`]);
	}, [
		handleMove, handleLook, handleHelp, handleInventory, handleTake,
		handleDrop, handleUse, handleOpenChest, handleTalk, handleExamine,
		handleAttack, handleExit, rooms, currentRoomId, roomStates, globalMeta, appendToLog
	]);

	// ===== EVENT HANDLERS =====
	const handleSubmit = (event) => {
		event.preventDefault();
		const trimmed = input.trim();
		if (!trimmed) {
			setInput('');
			return;
		}

		appendToLog([`> ${trimmed.toUpperCase()}`]);
		handleCommand(trimmed);
		setInput('');
	};

	const handleInputChange = (event) => {
		setInput(event.target.value.toUpperCase());
	};

	const handleInputBlur = () => {
		setTimeout(focusInput, 0);
	};

	const handleContainerClick = () => {
		focusInput();
	};

	// ===== RENDER =====
	return (
		<div
			className="h-screen flex flex-col bg-black text-white font-mono"
			onClick={handleContainerClick}
		>
			{/* Header with welcome text and exit button */}
			<div className="flex-shrink-0 border-b border-neutral-700 px-4 py-3 relative">
				<div className="pr-32">
					<div className="whitespace-pre-wrap">
						{log.slice(0, 2).join('\n')}
					</div>
				</div>
				<button
					type="button"
					onClick={handleExit}
					className="absolute top-3 right-4 px-3 py-1 text-xs border border-neutral-600 bg-neutral-900 hover:bg-neutral-800 transition-colors cursor-pointer"
				>
					SAVE &amp; QUIT
				</button>
			</div>

			{/* Scrollable game history */}
			<div ref={logContainerRef} className="flex-1 overflow-y-auto p-4 scroll-smooth">
				{log.slice(2).map((line, index) => (
					<div key={index + 2} className="whitespace-pre-wrap">
						{line}
					</div>
				))}
				<div ref={logEndRef} className="h-8" />
			</div>

			{/* Fixed input bar at bottom */}
			<form
				onSubmit={handleSubmit}
				className="flex-shrink-0 border-t border-neutral-700 px-4 py-2 bg-black"
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

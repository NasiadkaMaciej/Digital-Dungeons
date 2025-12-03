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

function describeRoom(room) {
	if (!room) return 'You are nowhere. This is probably a bug.';
	const desc =
		room.meta?.description ||
		'There is nothing remarkable about this place. The level designer hasn’t done their job yet.';
	return `${desc} [${room.id}]`;
}

export default function GameConsole({ initialData }) {
	const router = useRouter();

	const handleExit = useCallback(() => {
		// TODO: persist game state before leaving
		router.push('/');
	}, [router]);

	const rooms = initialData?.rooms ?? [];
	const startingRoomId =
		initialData?.selected || (rooms.length > 0 ? rooms[0].id : null);

	const [currentRoomId, setCurrentRoomId] = useState(startingRoomId);
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
		const room = findRoomById(rooms, startingRoomId);
		const initialMessages = [];

		initialMessages.push('WELCOME TO THE TEST DUNGEON.');
		initialMessages.push('TYPE HELP FOR AVAILABLE COMMANDS.');
		initialMessages.push('');
		initialMessages.push(describeRoom(room));

		setLog(initialMessages);
	}, [rooms, startingRoomId]);

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
			appendToLog(['', describeRoom(target)]);
		},
		[rooms, currentRoomId, appendToLog],
	);

	const handleHelp = useCallback(() => {
		appendToLog([
			'AVAILABLE COMMANDS:',
			'  HELP               - Show this help.',
			'  LOOK               - Re-describe your current location.',
			'  N / S / E / W      - Move north, south, east, or west.',
			'  GO NORTH|SOUTH...  - Verbose movement, same as N/S/E/W.',
			'',
		]);
	}, [appendToLog]);

	const handleLook = useCallback(() => {
		const room = findRoomById(rooms, currentRoomId);
		appendToLog(['', describeRoom(room)]);
	}, [rooms, currentRoomId, appendToLog]);

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

			// Stub for future commands such as INVENTORY, ATTACK, etc.
			appendToLog([`I don't recognise that command: "${cmd.raw}".`]);
		},
		[handleMove, handleLook, handleHelp, appendToLog],
	);

	const handleSubmit = (event) => {
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
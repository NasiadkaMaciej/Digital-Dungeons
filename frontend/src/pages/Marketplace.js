import React, { useEffect, useState } from 'react';
import { fetchGames } from '../api';

export default function Marketplace() {
	const [games, setGames] = useState([]);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchGames()
			.then(setGames)
			.catch((err) => setError(err.message));
	}, []);

	if (error) {
		return <div>Error: {error}</div>;
	}

	return (
		<div>
			<h1>Marketplace</h1>
			<ul>
				{games.map((game) => (
					<li key={game.game_id}>
						<h2>{game.title}</h2>
						<p>{game.description}</p>
					</li>
				))}
			</ul>
		</div>
	);
}

import GameConsole from '@/components/GameConsole';

const testGameData = {
    rooms: [
        {
            id: '0,0',
            gx: 0,
            gy: 0,
            meta: {
                description: 'You are in a dim stone chamber. Passages lead EAST and SOUTH.',
            },
        },
        {
            id: '1,0',
            gx: 1,
            gy: 0,
            meta: {
                description: 'A narrow corridor stretches west and south. The air smells damp.',
            },
        },
        {
            id: '0,1',
            gx: 0,
            gy: 1,
            meta: {
                description:
                    'You stand in a small alcove. You feel like someone is watching you from the shadows.',
            },
        },
    ],
    selected: '0,0',
};

export default function PlayPage() {
    return (
        <div
            className="fixed inset-0 z-[999999] bg-black overflow-hidden"
            style={{ position: 'fixed' }}
        >
            <GameConsole initialData={testGameData} />
        </div>
    );
}
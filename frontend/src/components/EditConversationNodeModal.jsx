'use client';

import {useEffect, useState} from 'react';

export default function EditConversationNodeModal({
                                                      isOpen,
                                                      node,
                                                      onClose,
                                                      onSave,
                                                  }) {
    const [value, setValue] = useState('');

    useEffect(() => {
        if (isOpen) {
            setValue(node?.meta?.label || '');
        }
    }, [isOpen, node]);

    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [isOpen, onClose]);

    if (!isOpen || !node) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(value);
    };

    return (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center px-12 py-10 bg-background/80 backdrop-blur-xs">
            <div className="bg-background border border-red-500 rounded-lg px-12 py-10 w-full max-w-lg shadow-2xl">
                <h2 className="text-2xl font-black mb-2">Edit Node Text</h2>
                <p className="text-sm text-foreground/60 font-mono mb-6">
                    Node ID: {node.id}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="node-label" className="block text-sm font-medium mb-2">
                            Label
                        </label>
                        <textarea
                            id="node-label"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            rows={6}
                            maxLength={500}
                            autoFocus
                            placeholder="Enter node text..."
                            className="w-full px-4 py-3 text-sm bg-foreground/5 border border-foreground/10 rounded focus:outline-none focus:border-red-500 text-foreground font-mono resize-none"
                        />
                        <div className="mt-2 text-sm text-foreground/60 font-mono">
                            {value.length}/500 characters
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-background border border-foreground/20 hover:border-red-500 rounded font-medium cursor-pointer text-sm text-foreground"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-red-500 hover:bg-red-700 rounded font-medium cursor-pointer text-sm text-background"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
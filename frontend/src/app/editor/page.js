import RPGEditorCanvas from '@/components/RPGEditorCanvas.jsx';
import BridgeProvider from "@/providers/BridgeProvider";
import NoScroll from "@/providers/NoScroll";
import ConversationCanvas from "@/components/ConversationCanvas";
import ConversationBridgeProvider from "@/providers/ConversationBridgeProvider";

export default function EditorPage() {
    return (
        <BridgeProvider>
            <ConversationBridgeProvider>
                <NoScroll>
                    {/* Base map editor */}
                    <RPGEditorCanvas />
                    {/* Conversations overlay (toggle with "C") */}
                    <ConversationCanvas />
                </NoScroll>
            </ConversationBridgeProvider>
        </BridgeProvider>
    );
}
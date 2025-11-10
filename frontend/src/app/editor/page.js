import RPGEditorCanvas from '@/components/RPGEditorCanvas.jsx';
import BridgeProvider from "@/providers/BridgeProvider";
import NoScroll from "@/providers/NoScroll";

export default function EditorPage() {
    return (
        <BridgeProvider>
            <NoScroll>
                <RPGEditorCanvas />
            </NoScroll>
        </BridgeProvider>
    );
}
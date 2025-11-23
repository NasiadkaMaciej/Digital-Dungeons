import Script from 'next/script';

export default function EditorLayout({ children }) {
    return (
        <>
            {/* Load the UMD bridge only for /editor, before client components under this segment */}
            <Script src="/rpg-editor-bridge.js" strategy="beforeInteractive" />
            <Script src="/conversation-editor-bridge.js" strategy="beforeInteractive" />
            {children}
        </>
    );
}
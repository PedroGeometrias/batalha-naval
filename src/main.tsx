import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";

const queryClient = new QueryClient();

async function start() {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass', serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` } });
    createRoot(document.getElementById('root')!).render(
        <StrictMode><QueryClientProvider client={queryClient}><App /></QueryClientProvider></StrictMode>,
    );
}

start().catch(() => {
    document.getElementById('root')!.innerHTML = '<main role="alert"><h1>Unable to start the network simulator</h1><p>Check that this page can use service workers, then try again.</p><button onclick="location.reload()">Retry</button></main>';
});

import { useEffect } from "react";

function App() {
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/test");

    ws.onopen = () => {
      console.log("Connected to backend WebSocket");
      ws.send("hello backend");
    };

    ws.onmessage = (event: MessageEvent) => {
      console.log("Message from backend:", event.data);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => ws.close();
  }, []);

  return (
    <div className="p-4 text-xl">
      Catan Online — Day 1 setup OK
      <br />
      Check browser console for WebSocket messages.
    </div>
  );
}

export default App;

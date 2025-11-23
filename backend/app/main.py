from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Backend running"}

@app.websocket("/ws/test")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Hello from Python backend!")

    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        print("Client disconnected")

from fastapi import FastAPI
import uvicorn
app = FastAPI()
@app.get("/drivers")
def d(): return [{"id": "test"}]
@app.get("/routes/active")
def ra(): return [{"id": "test_route"}]

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)

import uvicorn
from nw_tracker import main

if __name__ == "__main__":
    uvicorn.run(
        "nw_tracker.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
import os
from fastapi import FastAPI, UploadFile, File
import uvicorn
from ocr import parse_invoice

app = FastAPI()

@app.post("/scan")
async def scan_invoice(file: UploadFile = File(...)):
    contents = await file.read()
    result = parse_invoice(contents)
    return result

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3005))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

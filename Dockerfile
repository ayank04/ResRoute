FROM python:3.11-slim

# Set the working directory to the repository root
WORKDIR /workspace

# Copy the backend requirements and install them
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the necessary directories
COPY ai/ ./ai/
COPY backend/ ./backend/

# Switch working directory to backend so uvicorn can find main.py and imports work correctly
WORKDIR /workspace/backend

EXPOSE 8000

# Run Uvicorn pointing to main.py
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

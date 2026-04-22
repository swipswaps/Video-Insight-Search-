# Use Ubuntu as it handles ffmpeg and python/youtube-dl dependencies well
FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies: Node.js, Python3, FFmpeg, and youtube-dl
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    python3-pip \
    ffmpeg \
    software-properties-common \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && pip3 install youtube-dl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Build frontend
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/server.js"]

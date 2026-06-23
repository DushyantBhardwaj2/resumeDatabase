FROM node:20-bullseye-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma/ ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Start the server
CMD ["npx", "tsx", "src/index.ts"]

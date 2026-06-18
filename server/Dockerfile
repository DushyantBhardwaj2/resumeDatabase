FROM node:20-bullseye-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package.json (contains shared deps: better-auth, prisma, zod, pdf-parse, etc.)
COPY package.json package-lock.json* ./
COPY prisma/ ./prisma/
RUN npm install && npx prisma generate

# Copy shared source code
COPY src/core/ ./src/core/
COPY src/infrastructure/ ./src/infrastructure/
COPY src/config/ ./src/config/
COPY src/di/ ./src/di/

# Copy server-specific code
COPY server/package.json ./server/
COPY server/src/ ./server/src/
COPY server/tsconfig.json ./server/
COPY tsconfig.json ./

# Copy LaTeX template
COPY docs/ ./docs/

WORKDIR /app/server

EXPOSE 8080

CMD ["npm", "start"]

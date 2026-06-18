FROM node:20-bullseye-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy prisma schema before install so postinstall generates client
COPY backend/prisma/ ./prisma/
COPY backend/package.json backend/package-lock.json* ./
RUN npm install

COPY backend/src/ ./src/
COPY backend/tsconfig.json ./

# Copy LaTeX template for resume generation
COPY docs/ ./docs/

RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]

##############################################################################
# Stage 1 — builder
# Installs ALL deps (including devDeps), compiles TypeScript, copies assets.
##############################################################################
FROM node:20-bullseye-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma/ ./prisma/

# Install all deps (including devDeps: tsc, tsx, @types/*)
RUN npm ci

# Generate Prisma client (required before tsc so @prisma/client types resolve)
RUN npx prisma generate

# Copy source and compile TypeScript → dist/
# postbuild script also copies LaTeX template assets (.tex, config.json, .png)
COPY . .
RUN npm run build


##############################################################################
# Stage 2 — runtime
# Lean image: no devDeps, no source files, just dist/ + runtime node_modules.
##############################################################################
FROM node:20-bullseye-slim AS runtime

# ── System deps — texlive for pdflatex ────────────────────────────────────────
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only production node_modules from the builder (no devDeps)
COPY package.json package-lock.json* ./
COPY prisma/ ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# Copy compiled output from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 8080

# Run the pre-compiled JS — NOT tsx.
# tsx is a dev-only transpiler; using it in production compiles TypeScript on
# every module load, adding latency and shipping compiler overhead unnecessarily.
CMD ["node", "dist/index.js"]

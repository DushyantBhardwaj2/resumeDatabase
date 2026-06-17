FROM node:20-bullseye-slim

# Install TeX Live and required fonts/packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy the server code
COPY server.js ./

# Expose the port the app runs on
EXPOSE 8080

# Start the server
CMD ["npm", "start"]

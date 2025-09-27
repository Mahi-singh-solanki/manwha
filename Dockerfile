# Use the full Node.js 18 image
FROM node:24

# Set the working directory
WORKDIR /usr/src/app

# 1. INSTALL CHROMIUM (not Google Chrome)
# This installs the open-source version from the standard system repositories, which is more reliable.
RUN apt-get update \
    && apt-get install -y chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy and install your app's dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of your application code
COPY . .

# Command to start your server
CMD [ "node", "index.js" ]
# Use a Node.js 18 image as the base
FROM node:18

# 1. INSTALL OFFICIAL GOOGLE CHROME
# This section adds the Google Chrome repository and installs it directly
RUN apt-get update && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set up the working directory for your app
WORKDIR /usr/src/app

# Copy your package files
COPY package*.json ./

# Install your project's dependencies
# We use --production to make it smaller for deployment
RUN npm install --production

# Copy the rest of your application code
COPY . .

# The command to start your server
CMD [ "node", "index.js" ]
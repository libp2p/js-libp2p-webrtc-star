FROM node:lts-buster

# Install deps
RUN apt-get update && apt-get install -y \
  libssl-dev \
  ca-certificates

# Setup directories for the `node` user
RUN mkdir -p /home/node/app/webrtc-star/node_modules && chown -R node:node /home/node/app/webrtc-star

WORKDIR /home/node/app/webrtc-star

# Install node modules
COPY package.json ./
# Switch to the node user for installation
USER node
RUN npm install --production

# Copy over source files under the node user
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./README.md ./

# webrtc-star defaults to 9090
EXPOSE 9090

# Available overrides (defaults shown):
#   --port=9090 --host=0.0.0.0 --disableMetrics=false
# Server logging can be enabled via the DEBUG environment variable:
#   DEBUG=signalling-server,signalling-server:error
CMD [ "node", "src/sig-server/bin.js"]

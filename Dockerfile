FROM node:lts-alpine as node

FROM node as builder

# Install deps
RUN apk add build-base python3 libressl-dev ca-certificates

# Setup directories for the `node` user
RUN mkdir -p /home/node/app/webrtc-star/node_modules && chown -R node:node /home/node/app/webrtc-star

WORKDIR /home/node/app/webrtc-star

# Install node modules
COPY packages/webrtc-star-signalling-server/package.json ./
# Switch to the node user for installation
RUN npm install --production

# Copy over source files under the node user
COPY ./packages/webrtc-star-signalling-server/src ./src
COPY ./packages/webrtc-star-signalling-server/dist ./dist
COPY ./packages/webrtc-star-signalling-server/README.md ./

# Start from a clean node image
FROM node as server

# Prepare the working dir
RUN mkdir -p /home/node/app/webrtc-star/node_modules && chown -R node:node /home/node/app/webrtc-star
WORKDIR /home/node/app/webrtc-star

# Copy installed and compiled modules w/o build dependencies
COPY --from=builder --chown=node:node /home/node/app/webrtc-star /home/node/app/webrtc-star

# webrtc-star defaults to 9090
EXPOSE 9090

# Available overrides (defaults shown):
#   --port=9090 --host=0.0.0.0 --disableMetrics=false
# Server logging can be enabled via the DEBUG environment variable:
#   DEBUG=signalling-server,signalling-server:error
CMD [ "node", "dist/src/bin.js"]

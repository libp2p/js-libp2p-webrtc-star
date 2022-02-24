FROM node:lts-alpine as node

# Switch to the node user for installation
RUN npm install -g @libp2p/webrtc-star-signalling-server

# webrtc-star defaults to 9090
EXPOSE 9090

# Available overrides (defaults shown):
#   --port=9090 --host=0.0.0.0 --disableMetrics=false
# Server logging can be enabled via the DEBUG environment variable:
#   DEBUG=signalling-server,signalling-server:error
CMD [ "webrtc-star"]

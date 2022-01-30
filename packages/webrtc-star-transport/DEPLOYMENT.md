# Deployment

libp2p-webrtc-star is integrated with the [libp2p Docker Hub](https://hub.docker.com/u/libp2p) organization. Docker containers are built for passing CI to the `master` branch and to `tags`. The libp2p infra team leverages these containers to deploy and host webrtc-star services for users to test with. These servers should **not be relied on for Production applications**. If you wish to leverage webrtc-star servers for your application, we recommend running your own as we currently do not guarantee uptime of these servers.

## SSL & Localhost Development

Since working with localhost is a bit tricky at the time of writing, we recommend using proxy servers for the deployment. Here's a turnkey build for a signalling server which supports SSL.

1. `touch docker-compose.yml`, paste in the compose file below, and run `DOMAIN=<yourdomain.com> docker-compose up`. 
2. Visit yourdomain.com.  Voila!

```
version: "3.3"
services:

    js-libp2p-webrtc-star:
        image: libp2p/js-libp2p-webrtc-star
        environment:
            - VIRTUAL_HOST=${DOMAIN}
            - LETSENCRYPT_HOST=${DOMAIN}
            - VIRTUAL_PORT=9090
        networks:
            service_network:

    nginx-proxy:
        image: jwilder/nginx-proxy
        ports:
            - 443:443
            - 80:80
        container_name: nginx-proxy
        networks:
            service_network:
        volumes:
            - /var/run/docker.sock:/tmp/docker.sock:ro
            - nginx-certs:/etc/nginx/certs
            - nginx-vhost:/etc/nginx/vhost.d
            - nginx-html:/usr/share/nginx/html
        depends_on:
            - js-libp2p-webrtc-star

    nginx-proxy-letsencrypt:
        image: jrcs/letsencrypt-nginx-proxy-companion
        environment:
            NGINX_PROXY_CONTAINER: "nginx-proxy"
        networks:
            service_network:
        volumes:
            - /var/run/docker.sock:/var/run/docker.sock:ro
            - nginx-certs:/etc/nginx/certs
            - nginx-vhost:/etc/nginx/vhost.d
            - nginx-html:/usr/share/nginx/html

networks:
    service_network:

volumes:
    nginx-certs:
    nginx-vhost:
    nginx-html:
```

Kudos to @jjperezaguinaga for the initial proxy-wrap.

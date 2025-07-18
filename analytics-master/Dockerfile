FROM cubejs/cube:v1.3.34

COPY package*.json ./
RUN npm install

COPY . . 

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY env.sh /usr/local/bin/env.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh /usr/local/bin/env.sh

RUN ln -s /usr/local/bin/docker-entrypoint.sh /entrypoint.sh
RUN ln -s /usr/local/bin/env.sh /env.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

CMD ["cubejs", "server"]
FROM node:24.4-alpine

WORKDIR /app

RUN npm install -g pnpm@latest
RUN apk add --no-cache postgresql-client

RUN chown -R node:node /app

USER node

COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install

COPY --chown=node:node prisma ./prisma
RUN pnpm prisma generate

COPY --chown=node:node entrypoint.sh ./
RUN chmod +x entrypoint.sh
COPY --chown=node:node . .

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["pnpm", "run", "dev"]


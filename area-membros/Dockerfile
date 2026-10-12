# Área de membros: compila o app (Vite) e roda o servidor Node (sem dependências em produção).
# Railway/Render: aponte o serviço para a pasta area-membros/ e monte um volume em /data.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY web ./web
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3100 \
    DATA_DIR=/data \
    CONTENT_DIR=/data/content
COPY package.json catalog.js ./
COPY server ./server
COPY scripts ./scripts
COPY --from=build /app/web/dist ./web/dist
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3100/health || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server/index.js"]

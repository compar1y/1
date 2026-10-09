# Dockerfile do Retina na raiz do repositório (o Railway usa este automaticamente).
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DEMO_PORT=0 \
    RETINA_DATA_DIR=/data
COPY retina/package.json ./
COPY retina/server ./server
COPY retina/public ./public
COPY retina/dashboard ./dashboard
COPY retina/scripts ./scripts
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server/index.js"]

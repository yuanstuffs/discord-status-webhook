# Copied from
# https://github.com/skyra-project/teryl/blob/adb7ae587a91ba48b54b5ec38b5ec2297e3e7953/Dockerfile

# ================ #
#    Base Stage    #
# ================ #

FROM node:24-alpine AS base

WORKDIR /usr/src/app

ENV CI=true
ENV LOG_LEVEL=info
ENV FORCE_COLOR=true

RUN apk add --no-cache dumb-init python3 py3-setuptools && \
		apk add --no-cache --virtual .build-deps g++ make

COPY yarn.lock .
COPY package.json .
COPY .yarnrc.yml .
COPY .yarn/ .yarn/

ENTRYPOINT ["dumb-init", "--"]

# ================ #
#   Builder Stage  #
# ================ #

FROM base AS builder

ENV NODE_ENV="development"

COPY tsconfig.base.json .
COPY src/ src/

RUN yarn install --immutable
RUN yarn run build

# ================ #
#   Runner Stage   #
# ================ #

FROM base AS runner

ENV NODE_ENV="production"
ENV NODE_OPTIONS="--enable-source-maps"

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist dist/
COPY --from=builder /usr/src/app/src/.env src/.env

COPY --from=builder /usr/src/app/node_modules/sqlite3 node_modules/sqlite3/

RUN yarn workspaces focus --all --production

RUN apk del .build-deps
RUN rm -rf .yarn/cache

CMD [ "yarn", "run", "start" ]
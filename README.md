![npm](https://img.shields.io/npm/v/@bubblydoo/cloudflare-workers-postgres-client)

# Cloudflare Workers Postgres Client

This is an experimental module.

Heavily based on [cloudflare/worker-template-postgres](https://github.com/cloudflare/worker-template-postgres), but cleaned up and bundled into a single module.

This needs a Cloudflare Tunnel to your database running. To setup a Cloudflare Tunnel, you can use [this docker-compose.yml](https://github.com/bubblydoo/cloudflare-tunnel-postgres-docker-compose/blob/main/docker-compose.yml).

```bash
npm i @bubblydoo/cloudflare-workers-postgres-client
# or
yarn add @bubblydoo/cloudflare-workers-postgres-client
```

```ts
import { Client } from '@bubblydoo/cloudflare-workers-postgres-client';

const createClient = () => {
  return new Client({
    user: 'postgres',
    database: 'postgres',
    hostname: 'https://<YOUR CLOUDFLARE TUNNEL>',
    password: 'keyboardcat',
    port: 5432,
  });
}

const worker = {
  async fetch(request, env, ctx) {
    const client = createClient();

    await client.connect()

    const userIds = await client.queryArray('select id from "Users" limit 10');

    ctx.waitUntil(client.end());

    return new Response(JSON.stringify(userIds));
  }
}

export default worker;
```

## How it works

It uses the [postgres](https://deno.land/x/postgres@v0.17.0) Deno module, bundles it, and adds some code to make it work with Cloudflare Workers.

import { Client } from "#lib/db";
import { Server } from "#lib/server";
import { loadTest } from "#lib/load-test";

const stdout = process.stdout;

const client = new Client();
await client.connect();

const handler = async () => {
  const res = await client.query(`
    SELECT 
      p.post_id, p.title, p.content, p.slug, p.status, p.published_at, p.updated_at, 
      u.user_id, u.username, u.first_name, u.last_name, u.email, 
      cat.category_id, cat.name AS category_name, cat.slug AS category_slug, 
      c.comment_id, c.content AS comment_content, c.published_at AS comment_published_at, 
      cu.user_id AS comment_user_id, cu.username AS comment_user_username
    FROM (
      SELECT post_id, title, content, slug, status, published_at, updated_at, user_id
      FROM posts
      LIMIT 50
    ) p
    LEFT JOIN users u ON u.user_id = p.user_id
    LEFT JOIN posts_categories pc ON pc.post_id = p.post_id
    LEFT JOIN categories cat ON cat.category_id = pc.category_id
    LEFT JOIN comments c ON c.post_id = p.post_id
    LEFT JOIN users cu ON cu.user_id = c.user_id
  `);

  const posts = new Map();

  for (const row of res.rows) {
    if (!posts.has(row.post_id)) {
      posts.set(row.post_id, {
        id: row.post_id,
        title: row.title,
        content: row.content,
        slug: row.slug,
        status: row.status,
        publishedAt: row.published_at,
        updatedAt: row.updated_at,
        author: {
          id: row.user_id,
          email: row.email,
          username: row.username,
          firstName: row.first_name,
          lastName: row.last_name,
        },
        categories: new Map(),
        comments: new Map(),
      });
    }

    const post = posts.get(row.post_id);

    if (row.category_id && !post.categories.has(row.category_id)) {
      post.categories.set(row.category_id, {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug,
      });
    }

    if (row.comment_id && !post.comments.has(row.comment_id)) {
      post.comments.set(row.comment_id, {
        id: row.comment_id,
        content: row.comment_content,
        publishedAt: row.comment_published_at,
        user: {
          id: row.comment_user_id,
          username: row.comment_user_username,
        },
      });
    }
  }

  return Array.from(posts.values(), (post) => {
    post.categories = Array.from(post.categories.values());
    post.comments = Array.from(post.comments.values());
    return post;
  });
};

const server = new Server(handler);
const { port, hostname } = await server.start();

const result = await loadTest({ url: `http://${hostname}:${port}` });

stdout.write("\n");
stdout.write("Left join\n");
stdout.write(result);
stdout.write("\n");

process.exit(0);

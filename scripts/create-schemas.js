import { createClient } from "#db";

const client = await createClient();

try {
  await client.exec(`
    DROP TABLE IF EXISTS posts_categories;
    DROP TABLE IF EXISTS posts;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS status;

    CREATE TABLE status (
        status TEXT PRIMARY KEY
    );

    CREATE TABLE users (
        user_id INT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE categories (
        category_id INT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
        category_name TEXT NOT NULL,
        description TEXT NOT NULL,
        slug TEXT NOT NULL
    );

    CREATE TABLE posts (
        post_id INT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
        title TEXT NOT NULL,
        content	TEXT NOT NULL,
        slug TEXT NOT NULL,
        author_id INT NOT NULL REFERENCES users(user_id),
        status TEXT NOT NULL REFERENCES status(status),
        published_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE posts_categories (
        post_id INT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
        category_id INT NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, category_id)
    );
  `);

  console.log("Successfully created initial schemas");
  process.exit(0);
} catch (error) {
  console.error("Error while creating initial schemas");
  console.error(error);
  process.exit(1);
}

create database blog_platform;
\c blog_platform





create table if not exists users(id SERIAL PRIMARY KEY,
name VARCHAR(100),
email VARCHAR(100) UNIQUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);



create table if not exists posts(id SERIAL PRIMARY KEY,
title VARCHAR(255),
content TEXT,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);





create table if not exists comments(id SERIAL PRIMARY KEY,
text TEXT,
post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);




create table if not exists likes(user_id INTEGER,
post_id INTEGER,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY(user_id, post_id));


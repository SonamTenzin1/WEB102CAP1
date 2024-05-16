const http = require('http');
const fs = require('fs');

// Function to read posts from a JSON file
function readPosts() {
    return new Promise((resolve, reject) => {
        fs.readFile('posts.json', (err, data) => {
            if (err) reject(err);
            else resolve(JSON.parse(data));
        });
    });
}

// Function to write posts to a JSON file
function writePosts(posts) {
    return new Promise((resolve, reject) => {
        fs.writeFile('posts.json', JSON.stringify(posts, null, 2), (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// Create an HTTP server
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    switch (req.method) {
        case 'GET':
            // GET /posts - Retrieve all posts
            if (path === '/posts') {
                try {
                    const posts = await readPosts();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(posts));
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end(`Error: ${error.message}`);
                }
            } else {
                // Handle GET request for retrieving a single post by ID
                if (path.startsWith('/posts/')) {
                    const postId = Number(path.split('/').pop());
                    if (!isNaN(postId)) {
                        try {
                            const posts = await readPosts();
                            const post = posts.find(p => p.id === postId);
                            if (post) {
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify(post));
                            } else {
                                res.writeHead(404, { 'Content-Type': 'text/plain' });
                                res.end('Post not found');
                            }
                        } catch (error) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end(`Error: ${error.message}`);
                        }
                    } else {
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end('Invalid post ID');
                    }
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                }
            }
            break;

        case 'POST':
            // POST /posts/new - Create a new post
            if (path === '/posts/new') {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString(); // Convert Buffer to string
                });
                req.on('end', async () => {
                    const postData = JSON.parse(body);
                    try {
                        const posts = await readPosts();
                        const newPost = { ...postData, id: Date.now() };
                        posts.push(newPost);
                        await writePosts(posts);
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(newPost));
                    } catch (error) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end(`Error: ${error.message}`);
                    }
                });
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
            break;

        case 'PUT':
            // PUT /posts/:id - Update a post by ID
            if (path.startsWith('/posts/update/')) {
                const postIdToUpdate = Number(path.split('/').pop());
                if (!isNaN(postIdToUpdate)) {
                    let body = '';
                    req.on('data', chunk => {
                        body += chunk.toString(); // Convert Buffer to string
                    });
                    req.on('end', async () => {
                        const updateData = JSON.parse(body);
                        try {
                            const posts = await readPosts();
                            const index = posts.findIndex(p => p.id === postIdToUpdate);
                            if (index !== -1) {
                                posts[index] = { ...posts[index], ...updateData };
                                await writePosts(posts);
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify(posts[index]));
                            } else {
                                res.writeHead(404, { 'Content-Type': 'text/plain' });
                                res.end('Post not found');
                            }
                        } catch (error) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end(`Error: ${error.message}`);
                        }
                    });
                } else {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Invalid post ID');
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
            break;

        case 'DELETE':
            // DELETE /posts/:id - Delete a post by ID
            if (path.startsWith('/posts/delete/')) {
                const postIdToDelete = Number(path.split('/').pop());
                if (!isNaN(postIdToDelete)) {
                    try {
                        const posts = await readPosts();
                        const index = posts.findIndex(p => p.id === postIdToDelete);
                        if (index !== -1) {
                            posts.splice(index, 1);
                            await writePosts(posts);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(posts));
                        } else {
                            res.writeHead(404, { 'Content-Type': 'text/plain' });
                            res.end('Post not found');
                        }
                    } catch (error) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end(`Error: ${error.message}`);
                    }
                } else {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Invalid post ID');
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
            break;

        default:
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
            break;
    }
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

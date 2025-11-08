// server.js
const jsonServer = require('json-server');
const path = require('path');
const fs = require('fs');

const server = jsonServer.create();
const middlewares = jsonServer.defaults();
const dbPath = path.join(__dirname, '../db.json');
const router = jsonServer.router(dbPath);

server.use(middlewares);

server.use(jsonServer.rewriter({
  '/api/*': '/$1',
  '/blog/:resource/:id/show': '/:resource/:id'
}));

// Custom DELETE middleware to prevent cascade deletion
server.delete('/:resource/:id', (req, res) => {
  const { resource, id } = req.params;
  
  try {
    // Read the current database
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    // Check if the resource exists
    if (!db[resource]) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Find the item to delete
    const itemIndex = db[resource].findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Remove only the specific item
    const deletedItem = db[resource].splice(itemIndex, 1)[0];
    
    // Write back to db.json
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    
    // Return the deleted item
    res.status(200).json(deletedItem);
    
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.use(router);

server.listen(3000, () => {
  console.log('✅ JSON Server is running with persistent db.json');
  console.log('🛡️  Custom DELETE handler active - no cascade deletion');
});

module.exports = server;
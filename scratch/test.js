const fetch = require('node-fetch'); // If available, or just fetch in modern Node
async function test() {
  const res = await fetch('http://localhost:5005/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'testxyz123@example.com',
      password: 'password123',
      signature: 'http://res.cloudinary.com/fake/image.jpg'
    })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();

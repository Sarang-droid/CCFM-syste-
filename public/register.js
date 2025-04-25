document.getElementById('name').addEventListener('input', (e) => {
    const name = e.target.value.trim();
    const userIDField = document.getElementById('userID');
    if (name) {
      // Generate userID by combining name (no spaces) and a random 4-digit number
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const sanitizedName = name.replace(/\s+/g, '').toLowerCase();
      userIDField.value = `${sanitizedName}${randomNum}`;
    } else {
      userIDField.value = '';
    }
  });
  
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorElement = document.getElementById('error');
    errorElement.classList.add('hidden');
  
    const name = document.getElementById('name').value;
    const userID = document.getElementById('userID').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const branch = document.getElementById('branch').value;
  
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, userID, email, password, branch }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        window.location.href = '/login.html';
      } else {
        errorElement.textContent = data.message || 'Registration failed';
        errorElement.classList.remove('hidden');
      }
    } catch (error) {
      errorElement.textContent = 'An error occurred. Please try again.';
      errorElement.classList.remove('hidden');
    }
  });
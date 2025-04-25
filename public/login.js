document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorElement = document.getElementById('error');
    errorElement.classList.add('hidden');
  
    const userID = document.getElementById('userID').value;
    const password = document.getElementById('password').value;
  
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userID, password }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Store token in localStorage (or sessionStorage) for protected routes
        localStorage.setItem('token', data.token);
        window.location.href = '/CCFM.html';
      } else {
        errorElement.textContent = data.message || 'Login failed';
        errorElement.classList.remove('hidden');
      }
    } catch (error) {
      errorElement.textContent = 'An error occurred. Please try again.';
      errorElement.classList.remove('hidden');
    }
  });
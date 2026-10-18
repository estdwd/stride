document.addEventListener('DOMContentLoaded', () => {
  const sendCodeBtn = document.getElementById('send-code-btn');
  const loginBtn = document.getElementById('login-btn');
  const otpGroup = document.getElementById('otp-group');
  
  // Generate a random Unique ID for the student
  function generateID() {
    return 'STR-' + Math.floor(1000 + Math.random() * 9000);
  }
  
  // 1. Handle "Send Code"
  sendCodeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const age = document.getElementById('age').value;
    const course = document.getElementById('course').value;
    const phone = document.getElementById('phone').value;
    
    if (!name || !email || !age || !phone) {
      alert("Please fill in all fields.");
      return;
    }
    
    // NOTE: To actually send an email, you need an API here (like EmailJS).
    // For now, we simulate it.
    alert(`A login code has been sent to ${email} (Simulated).\n\nEnter any number to continue.`);
    
    // Reveal the OTP input and the Login button
    otpGroup.style.display = 'block';
    sendCodeBtn.style.display = 'none';
    loginBtn.style.display = 'block';
  });
  
  // 2. Handle "Verify & Login"
  loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const otp = document.getElementById('otp').value;
    
    if (!otp) {
      alert("Please enter the login code.");
      return;
    }
    
    // Create user object
    const user = {
      id: generateID(),
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      age: document.getElementById('age').value,
      course: document.getElementById('course').value,
      phone: document.getElementById('phone').value,
    };
    
    // Save to LocalStorage
    localStorage.setItem('stride_user', JSON.stringify(user));
    localStorage.setItem('stride_last_active', Date.now());
    
    // Redirect to app
    window.location.href = 'app.html';
  });
});
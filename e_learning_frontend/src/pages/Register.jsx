import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  // store step of the registration process
  // step 1 is role selection
  // step 2 is registration form
  const [step, setStep] = useState(1);
  // consolidates user data into a object
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: '' 
  });
  
  // UI states for confirm password, show password, success message
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Sets the chosen role 
  const selectRole = (selectedRole) => {
    setFormData({ ...formData, role: selectedRole });
    setStep(2); 
    setError('');
  };

  // handles the final form submission
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // check password length should longer 8
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // password should maching with comfirmPassword
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      // send post request to backend
      await api.post('users/register/', formData);
      
      // sucess msg 
      setSuccessMsg('Account created successfully! Redirecting to login...');
      
      // delay navigation by 2500 ms to let user read the message 
      setTimeout(() => {
        navigate('/login');
      }, 2500);

    } catch (err) {
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        const firstErrorKey = Object.keys(errorData)[0];
        setError(`${firstErrorKey}: ${errorData[firstErrorKey]}`);
      } else {
        setError('Registration failed. Please try again later.');
      }
      setIsLoading(false);
    } 
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full">
        
        {/* Role selection card */}
        {step === 1 && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-4xl font-extrabold text-slate-900">Join E Learning</h2>
              <p className="mt-3 text-lg text-slate-600">How would you like to use our platform?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div 
                onClick={() => selectRole('student')}
                className="group relative bg-white p-8 border-2 border-transparent rounded-2xl shadow-md hover:border-indigo-500 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">🎓</div>
                  <h3 className="text-2xl font-bold text-slate-900">I'm a Student</h3>
                  <p className="text-slate-500">I want to enroll in courses, learn new skills, and track my progress.</p>
                </div>
              </div>

              <div 
                onClick={() => selectRole('teacher')}
                className="group relative bg-white p-8 border-2 border-transparent rounded-2xl shadow-md hover:border-emerald-500 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">👨‍🏫</div>
                  <h3 className="text-2xl font-bold text-slate-900">I'm an Instructor</h3>
                  <p className="text-slate-500">I want to create courses, upload videos, and teach students.</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <span className="text-slate-600">Already have an account? </span>
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">Log in</Link>
            </div>
          </div>
        )}

        {/* Registration form */}
        {step === 2 && (
          <div className="max-w-md mx-auto bg-white p-10 rounded-xl shadow-lg border border-slate-100 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900">Create Account</h2>
              <p className="mt-2 text-sm text-slate-600 flex items-center justify-center gap-2">
                Signing up as a <span className="font-bold text-indigo-600 uppercase">{formData.role}</span>
                <button 
                  type="button"
                  onClick={() => setStep(1)} 
                  className="text-xs text-slate-400 hover:text-indigo-500 underline cursor-pointer"
                >
                  (Change)
                </button>
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success message */}
            {successMsg && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <p className="text-sm text-green-700 font-medium">{successMsg}</p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleRegister}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* Password with eye icon */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    className="appearance-none block w-full px-4 py-3 pr-10 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 cursor-pointer"
                  >
                    {/* show password */}
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">Must be at least 8 characters.</p>
              </div>

              {/* confirm password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading || successMsg !== ''}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  {isLoading ? 'Processing...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
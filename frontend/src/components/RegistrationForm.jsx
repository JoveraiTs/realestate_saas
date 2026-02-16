// components/RegistrationForm.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle, AlertCircle, Building2, Mail, Phone, MapPin, Globe, Crown, Loader } from 'lucide-react';

const RegistrationForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    domain: '',
    plan: 'professional'
  });
  
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const plans = [
    { id: 'basic', name: 'Starter', price: '$49/mo', icon: Building2 },
    { id: 'professional', name: 'Professional', price: '$99/mo', icon: Crown, popular: true },
    { id: 'enterprise', name: 'Enterprise', price: '$199/mo', icon: Crown }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateDomain = () => {
    if (formData.name) {
      const suggestedDomain = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20) + '.estatecrm.com';
      setFormData({ ...formData, domain: suggestedDomain });
    }
  };

  const validateForm = () => {
    if (!formData.name) return 'Company name is required';
    if (!formData.email) return 'Email is required';
    if (!formData.phone) return 'Phone number is required';
    if (!formData.address) return 'Address is required';
    if (!formData.domain) return 'Domain is required';
    if (!logo) return 'Company logo is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    // Create form data for API
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });
    if (logo) {
      submitData.append('logo', logo);
    }

    try {
      // Replace with your actual API endpoint
      const response = await fetch('https://0fnx75nt-8080.inc1.devtunnels.ms/api/tenants/register', {
        method: 'POST',
        body: submitData
      });

      if (!response.ok) {
        throw new Error('Registration failed. Please try again.');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Auto close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {!success ? (
            <>
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Register Your CRM
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Start your 14-day free trial
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="px-8 pt-6">
                <div className="flex items-center justify-between mb-8">
                  {['Company Info', 'Domain Setup', 'Choose Plan'].map((label, i) => (
                    <div key={i} className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        step > i + 1 ? 'bg-green-500 text-white' : 
                        step === i + 1 ? 'bg-blue-600 text-white' : 
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {step > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
                      </div>
                      {i < 2 && (
                        <div className={`w-16 h-1 mx-2 rounded ${
                          step > i + 1 ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="px-8 pb-8">
                {/* Step 1: Company Information */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="space-y-6">
                      {/* Logo Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Logo <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center space-x-6">
                          <div className="flex-shrink-0">
                            {logoPreview ? (
                              <div className="relative w-24 h-24 rounded-xl border-2 border-gray-200 overflow-hidden">
                                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                              </div>
                            ) : (
                              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <Building2 className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="relative">
                              <input
                                type="file"
                                id="logo"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="hidden"
                              />
                              <label
                                htmlFor="logo"
                                className="inline-flex items-center px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-600 cursor-pointer transition-colors"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Logo
                              </label>
                              <p className="mt-2 text-xs text-gray-500">
                                PNG, JPG, SVG up to 5MB
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Company Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                          placeholder="e.g., Luxury Homes Realty"
                        />
                      </div>

                      {/* Email & Phone */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                              placeholder="contact@company.com"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                              placeholder="+1 (555) 000-0000"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                            placeholder="123 Business St, Suite 100, City, State 12345"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Domain Setup */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                        <Globe className="w-8 h-8 text-blue-600 mb-3" />
                        <h3 className="text-lg font-semibold mb-2">Your Unique CRM Domain</h3>
                        <p className="text-gray-600 text-sm">
                          This will be your dedicated CRM URL. Make it memorable!
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Domain <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              name="domain"
                              value={formData.domain}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                              placeholder="yourcompany.estatecrm.com"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={generateDomain}
                            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                          >
                            Generate
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Only letters, numbers, and hyphens allowed
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Your CRM URL:</span>{' '}
                          {formData.domain ? (
                            <span className="text-blue-600 font-mono">
                              https://{formData.domain}
                            </span>
                          ) : (
                            <span className="text-gray-400">Enter domain above</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Choose Plan */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="space-y-6">
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Select Your Plan <span className="text-red-500">*</span>
                      </label>
                      
                      <div className="grid grid-cols-3 gap-4">
                        {plans.map((plan) => {
                          const Icon = plan.icon;
                          return (
                            <label
                              key={plan.id}
                              className={`
                                relative border-2 rounded-xl p-4 cursor-pointer transition-all
                                ${formData.plan === plan.id 
                                  ? 'border-blue-600 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                                }
                              `}
                            >
                              {plan.popular && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-3 py-1 rounded-full">
                                  Popular
                                </span>
                              )}
                              <input
                                type="radio"
                                name="plan"
                                value={plan.id}
                                checked={formData.plan === plan.id}
                                onChange={handleInputChange}
                                className="hidden"
                              />
                              <Icon className={`w-6 h-6 mb-3 ${
                                formData.plan === plan.id ? 'text-blue-600' : 'text-gray-400'
                              }`} />
                              <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{plan.price}</p>
                            </label>
                          );
                        })}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg mt-4">
                        <p className="text-sm text-gray-600">
                          ✓ 14-day free trial included • ✓ Cancel anytime • ✓ No credit card required
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Back
                    </button>
                  ) : (
                    <div></div>
                  )}
                  
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step + 1)}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        'Complete Registration'
                      )}
                    </button>
                  )}
                </div>
              </form>
            </>
          ) : (
            // Success State
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 px-8"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Registration Successful!
              </h3>
              <p className="text-gray-600 mb-8">
                Your CRM registration is pending approval. We'll send you an email with next steps.
              </p>
              <div className="bg-gray-50 p-6 rounded-xl max-w-md mx-auto">
                <p className="text-sm text-gray-600 mb-2">Your CRM Domain:</p>
                <p className="text-lg font-mono text-blue-600 break-all">
                  https://{formData.domain}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RegistrationForm;
// components/RealEstateCRM.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Shield, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Crown, 
  Sparkles,
  CheckCircle,
  Upload,
  ArrowRight,
  Star,
  Home,
  Key,
  Settings,
  BarChart3,
  Clock,
  Award
} from 'lucide-react';
import RegistrationForm from './RegistrationForm';
import FeatureCard from './FeatureCard';
import StatsSection from './StatsSection';
import PricingCard from './PricingCard';

const RealEstateCRM = () => {
  const [showForm, setShowForm] = useState(false);

  const features = [
    {
      icon: <Home className="w-6 h-6" />,
      title: "Property Management",
      description: "Manage unlimited properties with detailed analytics and media galleries"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Client Portal",
      description: "Dedicated portal for buyers, sellers, and agents to collaborate seamlessly"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Advanced Analytics",
      description: "Real-time market insights, sales forecasts, and performance metrics"
    },
    {
      icon: <Key className="w-6 h-6" />,
      title: "Smart Scheduling",
      description: "AI-powered property showing appointments and calendar management"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Documents",
      description: "End-to-end encrypted storage for contracts and legal documents"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Lead Generation",
      description: "Automated lead capture and nurturing with AI scoring"
    }
  ];

  const stats = [
    { value: "500+", label: "Active Real Estate Agencies", icon: <Building2 /> },
    { value: "50K+", label: "Properties Managed", icon: <Home /> },
    { value: "98%", label: "Client Satisfaction", icon: <Star /> },
    { value: "24/7", label: "Premium Support", icon: <Clock /> }
  ];

  const plans = [
    {
      name: "Starter",
      price: "$49",
      period: "month",
      features: ["Up to 5 agents", "100 properties", "Basic analytics", "Email support"],
      icon: <Building2 className="w-5 h-5" />,
      recommended: false
    },
    {
      name: "Professional",
      price: "$99",
      period: "month",
      features: ["Up to 20 agents", "500 properties", "Advanced analytics", "Priority support", "API access"],
      icon: <Sparkles className="w-5 h-5" />,
      recommended: true
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "month",
      features: ["Unlimited agents", "Unlimited properties", "Custom analytics", "Dedicated support", "White label"],
      icon: <Crown className="w-5 h-5" />,
      recommended: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-900/[0.02] -z-10" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-600/5 to-transparent" />
        
        <nav className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <Building2 className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                EstateCRM
              </span>
            </motion.div>
            
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:shadow-lg transition-all duration-300 font-medium"
            >
              Get Started
            </motion.button>
          </div>
        </nav>

        <div className="container mx-auto px-6 pt-20 pb-32">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 text-center lg:text-left"
            >
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full mb-6">
                <Award className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-600">#1 CRM for Real Estate</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                Transform Your
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Real Estate Business
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                Join 500+ successful real estate agencies using our AI-powered CRM to close deals faster, manage properties efficiently, and grow revenue.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold flex items-center justify-center group shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Register Your CRM Now
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all duration-300"
                >
                  Watch Demo
                </motion.button>
              </div>
              
              <div className="flex items-center justify-center lg:justify-start mt-8 space-x-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white" />
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-bold text-gray-900">4.9/5</span> from 2,500+ reviews
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1 relative"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-3xl opacity-20" />
                <img 
                  src="https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                  alt="Real Estate Dashboard"
                  className="relative rounded-3xl shadow-2xl border-8 border-white"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <StatsSection stats={stats} />

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Features</span>
            <h2 className="text-4xl font-bold mt-4 mb-6">
              Everything You Need to
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Scale Your Real Estate Business
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools designed specifically for modern real estate agencies
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Pricing</span>
            <h2 className="text-4xl font-bold mt-4 mb-6">
              Choose Your Perfect
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                CRM Plan
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start with a 14-day free trial, no credit card required
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <PricingCard key={index} {...plan} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form Modal */}
      {showForm && (
        <RegistrationForm onClose={() => setShowForm(false)} />
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Building2 className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold">EstateCRM</span>
            </div>
            <div className="flex space-x-8">
              <a href="#" className="hover:text-blue-400 transition-colors">About</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Features</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Pricing</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Contact</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 EstateCRM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RealEstateCRM;
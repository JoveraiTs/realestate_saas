"use client";

import { useState } from "react";
import { submitLead } from "@/lib/clientApi";

const initialData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
};

export default function LeadForm({ sourcePage = "contact", compact = false }) {
  const [formData, setFormData] = useState(initialData);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    setIsSubmitting(true);

    try {
      const payload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        sourcePage,
      };

      await submitLead(payload);
      setStatus({ type: "success", message: "Thank you. Our team will contact you shortly." });
      setFormData(initialData);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Could not submit your request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <form onSubmit={onSubmit} className="lead-grid">
        <input
          className="input"
          name="firstName"
          value={formData.firstName}
          onChange={onChange}
          placeholder="Your name"
          required
        />
        <input
          className="input"
          name="email"
          type="email"
          value={formData.email}
          onChange={onChange}
          placeholder="Your e-mail"
        />
        <input
          className="input"
          name="phone"
          value={formData.phone}
          onChange={onChange}
          placeholder="Phone"
        />
        <textarea
          className="textarea"
          name="message"
          value={formData.message}
          onChange={onChange}
          placeholder="Message"
        />
        <button type="submit" className="button" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Send message"}
        </button>
        {status.message ? <p className={`status ${status.type}`}>{status.message}</p> : null}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="lead-grid">
      <div className="lead-row">
        <div>
          <label className="label">First name</label>
          <input
            className="input"
            name="firstName"
            value={formData.firstName}
            onChange={onChange}
            placeholder="First name"
            required
          />
        </div>
        <div>
          <label className="label">Last name</label>
          <input
            className="input"
            name="lastName"
            value={formData.lastName}
            onChange={onChange}
            placeholder="Last name"
          />
        </div>
      </div>
      <div>
        <label className="label">Email</label>
        <input
          className="input"
          name="email"
          type="email"
          value={formData.email}
          onChange={onChange}
          placeholder="Enter your email"
        />
      </div>
      <div>
        <label className="label">Phone number</label>
        <input
          className="input"
          name="phone"
          value={formData.phone}
          onChange={onChange}
          placeholder="UAE +971"
        />
      </div>
      <div>
        <label className="label">Message</label>
        <textarea
          className="textarea"
          name="message"
          value={formData.message}
          onChange={onChange}
          placeholder="Tell us what you are looking for"
        />
      </div>
      <label className="checkbox-row">
        <input type="checkbox" required />
        <span>You agree to our friendly privacy policy.</span>
      </label>
      <button type="submit" className="button" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Send message"}
      </button>
      {status.message ? <p className={`status ${status.type}`}>{status.message}</p> : null}
    </form>
  );
}

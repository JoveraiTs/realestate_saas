"use client";

import { useState } from "react";
import { submitLead } from "@/lib/clientApi";

const initial = { name: "", email: "", phone: "", message: "" };

export default function PropertyContactCard({ sourcePage = "property" }) {
  const [form, setForm] = useState(initial);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const onChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      await submitLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
        sourcePage,
      });
      setStatus({ type: "success", message: "Thank you. Our team will contact you shortly." });
      setForm(initial);
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Could not submit your request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sp-card">
      <h3 className="sp-card-title">Contact US</h3>
      <form className="sp-contact-form" onSubmit={onSubmit}>
        <label>
          <span>First name</span>
          <input value={form.name} onChange={onChange("name")} placeholder="Your name" required />
        </label>
        <label>
          <span>Email</span>
          <input value={form.email} onChange={onChange("email")} placeholder="Enter your email" type="email" />
        </label>
        <label>
          <span>Phone number</span>
          <input value={form.phone} onChange={onChange("phone")} placeholder="UAE +971" />
        </label>
        <label>
          <span>Message</span>
          <textarea value={form.message} onChange={onChange("message")} placeholder="Tell us what you are looking for" />
        </label>

        <label className="sp-checkbox">
          <input type="checkbox" required />
          <span>You agree to our friendly privacy policy.</span>
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send message"}
        </button>

        {status.message ? (
          <p className={`sp-status ${status.type}`}>{status.message}</p>
        ) : null}
      </form>
    </div>
  );
}

"use client";

import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("UI ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="ops-table-card" style={{ padding: 16 }}>
          <div className="ops-table-head" style={{ borderBottom: "none", padding: 0 }}>
            <div>
              <h3>Something went wrong</h3>
              <p>{this.state.message}</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from "react";
import { useStore } from "../store/useStore";

export const DashboardPage = () => {
  const { user } = useStore();

  // 🔒 sécurité anti crash
  if (!user) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div style={{ color: "white", padding: 20 }}>
      <h1>Dashboard</h1>

      <p><strong>Email :</strong> {user.email}</p>
      <p><strong>UID :</strong> {user.uid}</p>

      <p style={{ marginTop: 20, opacity: 0.6 }}>
        🎯 Login fonctionne → base validée
      </p>
    </div>
  );
};

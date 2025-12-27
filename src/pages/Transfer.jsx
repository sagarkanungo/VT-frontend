import React, { useState } from "react";
import apiClient from "../../utils/axios";
import { getUserFromToken } from "../../utils/auth";
import { isTransactionAllowed } from "../../utils/timeUtils";
import TransactionGuard from "../components/TransactionGuard";

function Transfer({onTransferSuccess}) {
  const user = getUserFromToken();
  if (!user) window.location.href = "/login";

  const [form, setForm] = useState({
    mobile: "",
    amount: "",
    pin: "",
    note: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSend = async () => {
    if (!form.mobile || !form.amount || !form.pin) {
      alert("All required fields needed");
      return;
    }

    // Check if transactions are allowed before proceeding
    const timeCheck = await isTransactionAllowed();
    if (!timeCheck.allowed) {
      alert(timeCheck.message);
      return;
    }

    try {
      await apiClient.post("/api/transfer", {
        user_id: user.id,
        phone: form.mobile,
        amount: form.amount,
        pin: form.pin,
        note: form.note,
      });

      alert("Money sent successfully");
      if (onTransferSuccess) onTransferSuccess();
      setForm({ mobile: "", amount: "", pin: "", note: "" });
    } catch (err) {
      alert(err.response?.data?.error || "Transfer failed");
    }
  };

  return (
    <TransactionGuard>
      <div className="card transfer-form">
        <h3>Transfer Money</h3>

        <input
          name="mobile"
          placeholder="Recipient Mobile"
          value={form.mobile}
          onChange={handleChange}
        />

        <input
          name="amount"
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
        />

        <input
          name="pin"
          type="password"
          placeholder="4-digit PIN"
          value={form.pin}
          onChange={handleChange}
          maxLength={4}
        />

        <textarea
          name="note"
          placeholder="Optional Note"
          value={form.note}
          onChange={handleChange}
        />

        <button className="btn-primary" onClick={handleSend}>
          Send
        </button>
      </div>
    </TransactionGuard>
  );
}

export default Transfer;

// src/components/Referral.js
import { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";

function Referral() {
  const [copySuccess, setCopySuccess] = useState(false);
  const WEB_APP_URL = "https://breetta.com/"; 


  const referralMessage =
  `Hey! Check out Breetta - it's amazing for managing transactions and entries. Download it now! ${WEB_APP_URL}`;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="referral-section">
      <div className="referral-header">
        <h2>Share Breetta</h2>
        <p>Invite your friends to join Breetta!</p>
      </div>

      {/* App Info */}
      <div className="app-info-card">
        <div className="app-icon">💸</div>
        <div className="app-details">
          <h3>Breetta</h3>
          <p>The best app for managing your transactions and entries</p>
        </div>
      </div>

      {/* Share Message */}
      <div className="share-message-section">
        <h3>Share Message</h3>
        <div className="message-container">
          <textarea
            value={referralMessage}
            readOnly
            className="share-message-input"
            rows="3"
          />
          <button
            className="copy-btn"
            onClick={() => copyToClipboard(referralMessage)}
          >
            {copySuccess ? <FiCheck /> : <FiCopy />}
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      {/* Share Buttons */}
<div className="share-buttons">
  <h3>Share Now</h3>
  <div className="share-options">
    <button
      className="share-btn whatsapp"
      onClick={() =>
        window.open(`https://wa.me/?text=${referralMessage} ${WEB_APP_URL}`, "_blank")
      }
    >
      📱 WhatsApp
    </button>

    <button
      className="share-btn telegram"
      onClick={() =>
        window.open(`https://t.me/share/url?text=${referralMessage} ${WEB_APP_URL}`, "_blank")
      }
    >
      ✈️ Telegram
    </button>

    <button
      className="share-btn facebook"
      onClick={() =>
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${WEB_APP_URL}&quote=${referralMessage}`,
          "_blank"
        )
      }
    >
      📘 Facebook
    </button>

    <button
      className="share-btn twitter"
      onClick={() =>
        window.open(
          `https://twitter.com/intent/tweet?text=${referralMessage} ${WEB_APP_URL}`,
          "_blank"
        )
      }
    >
      🐦 Twitter
    </button>

    <button
      className="share-btn copy"
      onClick={() => copyToClipboard(`${referralMessage} ${WEB_APP_URL}`)}
    >
      📋 Copy Message
    </button>
  </div>
</div>


      {/* Why Share */}
      {/* <div className="why-share">
        <h3>Why Share Breetta?</h3>
        <div className="benefits">
          <div className="benefit">
            <div className="benefit-icon">✨</div>
            <div className="benefit-content">
              <h4>Easy to Use</h4>
              <p>Simple and intuitive interface for everyone</p>
            </div>
          </div>
          <div className="benefit">
            <div className="benefit-icon">🔒</div>
            <div className="benefit-content">
              <h4>Secure</h4>
              <p>Your data and transactions are completely safe</p>
            </div>
          </div>
          <div className="benefit">
            <div className="benefit-icon">⚡</div>
            <div className="benefit-content">
              <h4>Fast</h4>
              <p>Quick transactions and instant updates</p>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
}

export default Referral;

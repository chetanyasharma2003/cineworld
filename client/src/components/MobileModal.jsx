import { useEffect } from "react";
import "./MobileModal.css";

export default function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  fullScreen = false,
  showCloseButton = true,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className={`mobile-modal ${fullScreen ? "fullscreen" : ""}`}>
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            {showCloseButton && (
              <button
                className="modal-close"
                onClick={onClose}
                aria-label="Close modal"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </>
  );
}

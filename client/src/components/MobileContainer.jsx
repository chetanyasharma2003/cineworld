import "./MobileContainer.css";

export default function MobileContainer({
  children,
  className = "",
  padding = true,
  fullHeight = false,
  noPadding = false,
}) {
  return (
    <div
      className={`mobile-container ${className} ${
        padding && !noPadding ? "with-padding" : ""
      } ${fullHeight ? "full-height" : ""}`}
    >
      {children}
    </div>
  );
}

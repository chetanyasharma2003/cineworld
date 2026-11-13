import { useResponsive } from "../hooks/useResponsive";
import "./ResponsiveGrid.css";

export default function ResponsiveGrid({
  children,
  columns = "auto",
  gap = "16px",
  className = "",
  minWidth = "150px",
}) {
  const { isMobile, isTablet } = useResponsive();

  let gridColumns = columns;
  if (columns === "auto") {
    if (isMobile) {
      gridColumns = "repeat(auto-fill, minmax(140px, 1fr))";
    } else if (isTablet) {
      gridColumns = "repeat(auto-fill, minmax(160px, 1fr))";
    } else {
      gridColumns = "repeat(auto-fill, minmax(180px, 1fr))";
    }
  }

  return (
    <div
      className={`responsive-grid ${className}`}
      style={{
        display: "grid",
        gridTemplateColumns: gridColumns,
        gap: gap,
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

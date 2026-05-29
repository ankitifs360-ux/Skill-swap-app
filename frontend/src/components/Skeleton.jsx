function Skeleton({ height = 16, width = "100%", radius = 12, style = {}, className = "" }) {
  return (
    <div
      className={`skeleton-block ${className}`.trim()}
      style={{
        height,
        width,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

export default Skeleton;

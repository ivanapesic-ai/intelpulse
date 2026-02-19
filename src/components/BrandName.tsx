interface BrandNameProps {
  className?: string;
}

const BrandName = ({ className = "" }: BrandNameProps) => (
  <span className={`${className}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
    <span style={{ fontWeight: 400, fontSize: '1.15em' }}>pulse</span>
    <span style={{ fontWeight: 600 }}>11</span>
  </span>
);

export default BrandName;

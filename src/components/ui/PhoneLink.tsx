interface PhoneLinkProps {
  phone: string;
  rawPhone: string;
  label?: string;
  className?: string;
}

export default function PhoneLink({
  phone,
  rawPhone,
  label,
  className,
}: PhoneLinkProps) {
  return (
    <a href={`tel:${rawPhone}`} className={className}>
      {label || phone}
    </a>
  );
}

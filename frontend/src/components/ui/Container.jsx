// One container width for every page section
export default function Container({ className = '', children, as: Tag = 'div' }) {
  return <Tag className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</Tag>;
}

// Section with the standard vertical rhythm. tone: white | cream | navy | peach
const TONES = {
  white: 'bg-white',
  cream: 'bg-brand-cream',
  navy: 'bg-brand-navy text-white',
  peach: 'bg-amber-50'
};

export function Section({ tone = 'white', className = '', containerClass = '', children, ...rest }) {
  return (
    <section className={`${TONES[tone]} py-8 sm:py-12 ${className}`} {...rest}>
      <Container className={containerClass}>{children}</Container>
    </section>
  );
}

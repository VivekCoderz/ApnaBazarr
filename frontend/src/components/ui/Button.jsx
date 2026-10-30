import { Link } from 'react-router-dom';

import { buttonClass } from './buttonClass';

export default function Button({ to, href, variant = 'primary', size = 'md', className = '', children, ...rest }) {
  const cls = buttonClass(variant, size, className);
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>;
  if (href) {
    const external = /^https?:/.test(href);
    return (
      <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} {...rest}>
        {children}
      </a>
    );
  }
  return <button type="button" className={cls} {...rest}>{children}</button>;
}
